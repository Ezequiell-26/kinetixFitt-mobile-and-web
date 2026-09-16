/**
 * Sistema de Logs de Auditoría para KINETIXFITT
 * Registra todas las acciones importantes de usuarios y sistema para seguridad y compliance
 */

import { z } from 'zod';
import { useState, useEffect } from 'react';

// Schema para eventos de auditoría
const AuditEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number(),
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userRole: z.enum(['client', 'trainer', 'admin']).optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  method: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT']),
  status: z.enum(['SUCCESS', 'FAILURE', 'PENDING']),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  reason: z.string().optional(), // Para cambios sensibles o eliminaciones
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

// Tipos de eventos predefinidos
export const AUDIT_ACTIONS = {
  // Autenticación
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REGISTER: 'auth.register',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_PASSWORD_CHANGE: 'auth.password_change',
  
  // Usuarios
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',
  
  // Clientes
  CLIENT_CREATE: 'client.create',
  CLIENT_UPDATE: 'client.update',
  CLIENT_DELETE: 'client.delete',
  CLIENT_ASSIGN: 'client.assign',
  CLIENT_UNASSIGN: 'client.unassign',
  
  // Entrenamientos
  WORKOUT_CREATE: 'workout.create',
  WORKOUT_UPDATE: 'workout.update',
  WORKOUT_DELETE: 'workout.delete',
  WORKOUT_COMPLETE: 'workout.complete',
  WORKOUT_LOG_CREATE: 'workout_log.create',
  WORKOUT_LOG_UPDATE: 'workout_log.update',
  
  // Nutrición
  NUTRITION_PLAN_CREATE: 'nutrition_plan.create',
  NUTRITION_PLAN_UPDATE: 'nutrition_plan.update',
  MEAL_LOG_CREATE: 'meal_log.create',
  MEAL_LOG_UPDATE: 'meal_log.update',
  
  // Progreso
  CHECKIN_CREATE: 'checkin.create',
  CHECKIN_UPDATE: 'checkin.update',
  PROGRESS_PHOTO_UPLOAD: 'progress_photo.upload',
  MEASUREMENT_CREATE: 'measurement.create',
  
  // Mensajes
  MESSAGE_SEND: 'message.send',
  MESSAGE_DELETE: 'message.delete',
  
  // Archivos
  FILE_UPLOAD: 'file.upload',
  FILE_DOWNLOAD: 'file.download',
  FILE_DELETE: 'file.delete',
  
  // Exportación/Importación
  DATA_EXPORT: 'data.export',
  DATA_IMPORT: 'data.import',
  
  // Configuración
  SETTINGS_UPDATE: 'settings.update',
  PREFERENCES_UPDATE: 'preferences.update',
  
  // Pagos
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  SUBSCRIPTION_CREATE: 'subscription.create',
  SUBSCRIPTION_CANCEL: 'subscription.cancel',
  
  // Sistema
  BACKUP_CREATE: 'backup.create',
  BACKUP_RESTORE: 'backup.restore',
  SYSTEM_ERROR: 'system.error',
} as const;

// Almacenamiento en memoria para desarrollo (en producción usar base de datos)
const auditLogStore: AuditEvent[] = [];
const MAX_STORE_SIZE = 1000;

/**
 * Generar ID UUID para evento de auditoría.
 * crypto.randomUUID() evita colisiones previsibles y satisface el schema UUID.
 */
function generateAuditId(): string {
  return crypto.randomUUID();
}

/**
 * Obtener IP del usuario (para Next.js API routes)
 */
export function getUserIP(headers: Headers): string | undefined {
  const forwarded = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || undefined;
}

/**
 * Obtener User Agent de los headers
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined;
}

/**
 * Registrar evento de auditoría
 */
export async function logAuditEvent(
  event: Omit<AuditEvent, 'id' | 'timestamp'>
): Promise<AuditEvent> {
  const auditEvent: AuditEvent = {
    ...event,
    id: generateAuditId(),
    timestamp: Date.now(),
  };

  // Validar evento
  const validatedEvent = AuditEventSchema.parse(auditEvent);

  // Guardar en store (en producción guardar en base de datos)
  auditLogStore.push(validatedEvent);
  
  // Limitar tamaño del store
  if (auditLogStore.length > MAX_STORE_SIZE) {
    auditLogStore.shift();
  }

  // Enviar a servicio externo si está configurado (ej: Sentry, Datadog)
  if (process.env.AUDIT_WEBHOOK_URL) {
    try {
      await fetch(process.env.AUDIT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedEvent),
      });
    } catch (error) {
      console.error('Failed to send audit event to webhook:', error);
    }
  }

  // Loggear eventos críticos en consola (solo desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', validatedEvent.action, validatedEvent.status, validatedEvent.resourceId);
  }

  return validatedEvent;
}

/**
 * Middleware para Next.js API routes que agrega logging automático
 */
export function withAudit<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options: {
    action: string;
    resource: string;
    getResourceId?: (result: any) => string;
    logRequestBody?: boolean;
    logResponseBody?: boolean;
  }
) {
  return async (...args: any[]) => {
    const request = args[0] as Request;
    const startTime = Date.now();

    try {
      const result = await handler(...args);
      
      // Log exitoso
      await logAuditEvent({
        action: options.action,
        resource: options.resource,
        resourceId: options.getResourceId ? options.getResourceId(result) : undefined,
        method: request.method as any,
        status: 'SUCCESS',
        metadata: {
          duration: Date.now() - startTime,
          ...(options.logResponseBody ? { response: result } : {}),
        },
      });

      return result;
    } catch (error) {
      // Log fallido
      await logAuditEvent({
        action: options.action,
        resource: options.resource,
        method: request.method as any,
        status: 'FAILURE',
        reason: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: Date.now() - startTime,
          error: error instanceof Error ? { name: error.name, message: error.message } : error,
        },
      });

      throw error;
    }
  };
}

/**
 * Obtener logs de auditoría filtrados
 */
export function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: number;
  endDate?: number;
  status?: 'SUCCESS' | 'FAILURE' | 'PENDING';
}): AuditEvent[] {
  let logs = [...auditLogStore];

  if (filters) {
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    if (filters.resource) {
      logs = logs.filter(log => log.resource === filters.resource);
    }
    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }
    if (filters.status) {
      logs = logs.filter(log => log.status === filters.status);
    }
  }

  // Ordenar por timestamp descendente
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Limpiar logs antiguos (útil para mantenimiento)
 */
export function cleanupOldAuditLogs(daysToKeep: number = 90): number {
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  const initialLength = auditLogStore.length;
  
  const filtered = auditLogStore.filter(log => log.timestamp > cutoffTime);
  auditLogStore.length = 0;
  auditLogStore.push(...filtered);
  
  return initialLength - auditLogStore.length;
}

/**
 * Hook React para mostrar logs de auditoría (para admin dashboard)
 */
export function useAuditLogs(userId?: string) {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchedLogs = getAuditLogs(userId ? { userId } : undefined);
    setLogs(fetchedLogs);
    setLoading(false);
  }, [userId]);

  return { logs, loading };
}

// Export para uso en componentes React
export default {
  logAuditEvent,
  getAuditLogs,
  cleanupOldAuditLogs,
  getUserIP,
  getUserAgent,
  withAudit,
  useAuditLogs,
  AUDIT_ACTIONS,
  AuditEventSchema,
};
