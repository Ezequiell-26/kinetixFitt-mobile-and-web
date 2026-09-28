# Changelog

Todas las versiones notables de KINETIXFITT.

## [Unreleased]

### Calidad de producto y verificación
- Corregido el arranque de Playwright para reutilizar el servidor Next ya levantado por CI.
- CI inicia explícitamente el servidor Next standalone generado por el build.
- Agregadas las traducciones faltantes de navegación y login que generaban warnings en runtime.
- Eliminados controles de demo que permitían fabricar XP o completar desafíos sin una actividad registrada.
- Leaderboard global oculto cuando no existe una fuente persistente y aislada por usuario.

### Gamificación y persistencia
- Se aisló el estado de logros por usuario para evitar que un desbloqueo afecte a otras cuentas.
- El progreso de XP, monedas, rachas y logros se restaura desde almacenamiento local cuando está disponible.
- Se corrigió la progresión inicial de niveles para evitar que una cuenta nueva retroceda de nivel con su primer XP.
- Se agregaron validaciones de entrada para recompensas y finalización de entrenamientos.
 - 2026-09-28

### Mejorado
- Alineación de branding móvil y compartido con el token semántico emerald `#34D399` ya definido por el design system.
- Navegación, landing, botones, badges y estados de carga/error migrados desde acentos hardcodeados a tokens semánticos.
- Soporte de WhatsApp convertido en configuración opcional mediante `NEXT_PUBLIC_WHATSAPP_NUMBER`; sin número configurado no se muestra ningún enlace de WhatsApp inválido.

### Corregido
- Eliminadas acciones sin comportamiento de Recursos VIP ("Ver" y "Guardar") que aparentaban estar implementadas.
- El contador de recursos ahora refleja el catálogo realmente visible en pantalla en lugar de una cifra fija.
- Añadido `rel="noreferrer"` y nombre accesible al enlace de WhatsApp.

### Validación
- Auditoría `npm run ai:audit` ejecutada en remoto: OK.
- Instalación reproducible `npm ci` ejecutada en remoto: OK.
- La validación de CI/Vercel queda pendiente sobre el PR #82; la conexión Vercel disponible actualmente no expone los proyectos para inspeccionar sus logs.

## [1.0.1] - 2026-09-10 — Lote 1: persistencia de programas y asignación

### Corregido
- **Editar un programa con historial ya no falla ni borra registros**: `WorkoutLog.workoutId` pasó a opcional con `onDelete: SetNull` y se agregó `workoutName` como snapshot del nombre de la sesión. Antes, el `PUT` reventaba con error 500 por la FK Restrict cuando el programa tenía logs.
- **Guardado de programas atómico**: `POST /api/programs` y `PUT /api/programs/[id]` corren en una sola transacción (`replaceProgramWeeks` acepta el cliente de transacción). Si algo falla a mitad del guardado, el programa queda como estaba.
- **workout-logs ya no sustituye IDs silenciosamente**: un `workoutId` inexistente ahora devuelve 404 (antes se guardaba contra el primer workout de la base) y un atleta no puede registrar entrenamientos de un programa que no le fue asignado (403).
- **Un atleta sin programa asignado ve el estado "Ezequiel está diseñando tu plan"** en `/client/workout`; se eliminó el fallback que le mostraba el primer programa de la base.
- Un CLIENT ya no puede leer programas que no le fueron asignados (`GET /api/programs` y `GET /api/programs/[id]` filtran por asignación) ni autoasignarse un programa vía `PATCH /api/clients/[id]` (solo TRAINER).

### Test
- `npm run test:core`: regresión de edición de programas contra una copia de la DB (9 asserts: log sobrevive, snapshot del nombre, transacción fallida no deja estado parcial).

### Notas
- Migración `20260910143357_workoutlog_history_preserving` (no destructiva). Respaldo previo: `prisma/dev.db.backup-20260910`.
- Reiniciar el dev server para que cargue el Prisma Client regenerado.

## [1.0.0] - 2026-09-09

### Agregado
- 37 rutas, 18 modelos Prisma, 15 índices
- Auth JWT TRAINER/CLIENT con RLS real
- Dashboard trainer con charts Recharts + analíticas
- Creador Program → Fase → Semana → Día con superseries
- Experiencia entrenar con timer, RIR, vibración y guardado real
- Biblioteca 10 ejercicios, progreso con slider, fotos reales con upload
- Check-ins y mensajes 100% reales con DB
- Nutrición VIP: TDEE, macros, 1RM, hábitos, calendario
- PWA instalable Android/iOS, tema blanco/negro, offline
- Recursos VIP y WhatsApp flotante

### Seguridad
- Middleware por rol, RLS por userId, Zod, sin any

### Rendimiento
- Build 102kB, Promise.all, debounce, índices, paginación

