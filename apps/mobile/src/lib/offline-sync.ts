/**
 * Sistema de sincronización offline para KinetixFitt.
 *
 * IndexedDB es la fuente primaria para operaciones pendientes porque mantiene
 * objetos de mayor tamaño y no depende del límite práctico de localStorage.
 * Se conserva una migración de lectura desde localStorage para no perder
 * operaciones existentes creadas por versiones anteriores.
 */

"use client";

import { useEffect, useState } from "react";

export interface PendingOperation {
  id: string;
  type: "workout-log" | "measurement" | "checkin" | "message";
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = "kinetixfit_offline_operations";
const DB_NAME = "kinetixfitt-offline";
const DB_VERSION = 1;
const STORE_NAME = "operations";
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 200;
const MAX_ITEM_BYTES = 256 * 1024;
const SYNC_INTERVAL = 30000;

export function isOnline(): boolean {
  return typeof window === "undefined" ? true : navigator.onLine;
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return online;
}

function isPendingOperation(value: unknown): value is PendingOperation {
  if (!value || typeof value !== "object") return false;
  const op = value as Partial<PendingOperation>;
  return (
    typeof op.id === "string" &&
    typeof op.endpoint === "string" &&
    typeof op.type === "string" &&
    typeof op.method === "string" &&
    typeof op.timestamp === "number" &&
    typeof op.retryCount === "number"
  );
}

function readLegacyQueue(): PendingOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPendingOperation);
  } catch {
    return [];
  }
}

function clearLegacyQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be blocked by browser privacy settings.
  }
}

function openDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB no está disponible"));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir IndexedDB"));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function readIndexedQueue(): Promise<PendingOperation[]> {
  const db = await openDb();
  try {
    const values = await new Promise<PendingOperation[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onerror = () => reject(request.error ?? new Error("No se pudo leer la cola offline"));
      request.onsuccess = () => {
        const operations = Array.isArray(request.result) ? request.result.filter(isPendingOperation) : [];
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };
    });
    return values;
  } finally {
    db.close();
  }
}

async function writeIndexedOperation(operation: PendingOperation): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(operation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo guardar la operación offline"));
    });
  } finally {
    db.close();
  }
}

async function deleteIndexedOperation(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo eliminar la operación offline"));
    });
  } finally {
    db.close();
  }
}

async function replaceIndexedQueue(queue: PendingOperation[]): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const operation of queue.slice(-MAX_QUEUE_SIZE)) store.put(operation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo actualizar la cola offline"));
    });
  } finally {
    db.close();
  }
}

async function migrateLegacyQueue(): Promise<void> {
  const legacy = readLegacyQueue();
  if (legacy.length === 0) return;

  const existing = await readIndexedQueue();
  const ids = new Set(existing.map((operation) => operation.id));
  const merged = [...existing, ...legacy.filter((operation) => !ids.has(operation.id))]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_QUEUE_SIZE);

  await replaceIndexedQueue(merged);
  clearLegacyQueue();
}

async function readQueue(): Promise<PendingOperation[]> {
  try {
    await migrateLegacyQueue();
    return await readIndexedQueue();
  } catch {
    // Fallback only for browsers without IndexedDB.
    return readLegacyQueue();
  }
}

async function writeQueue(queue: PendingOperation[]): Promise<void> {
  const bounded = queue.slice(-MAX_QUEUE_SIZE);
  try {
    await replaceIndexedQueue(bounded);
  } catch {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
      } catch {
        // Do not crash the workout UI if persistent storage is unavailable.
      }
    }
  }
}

export async function queueOperation(
  operation: Omit<PendingOperation, "id" | "timestamp" | "retryCount">
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Offline queue solo está disponible en el navegador");
  }

  const serialized = JSON.stringify(operation.data);
  const bytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(serialized).byteLength : serialized.length;
  if (bytes > MAX_ITEM_BYTES) {
    throw new Error("La operación offline es demasiado grande");
  }

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `op_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const pendingOp: PendingOperation = {
    ...operation,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const existing = await readQueue();
  if (existing.length >= MAX_QUEUE_SIZE) existing.shift();
  await writeQueue([...existing, pendingOp]);

  return id;
}

export function getQueuedOperations(): PendingOperation[] {
  // Synchronous compatibility API. New code should prefer getPendingCount()
  // or syncPendingOperations(), both of which read IndexedDB asynchronously.
  return readLegacyQueue();
}

export async function removeOperation(id: string): Promise<void> {
  try {
    await deleteIndexedOperation(id);
  } catch {
    const queue = readLegacyQueue().filter((operation) => operation.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // Ignore storage failures.
    }
  }
}

export async function syncPendingOperations(): Promise<{ success: number; failed: number }> {
  if (!isOnline()) return { success: 0, failed: 0 };

  const operations = await readQueue();
  let success = 0;
  let failed = 0;

  for (const operation of operations) {
    if (operation.retryCount >= MAX_RETRIES) {
      await removeOperation(operation.id);
      failed++;
      continue;
    }

    try {
      const response = await fetch(operation.endpoint, {
        method: operation.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operation.data),
      });

      if (response.ok || response.status === 409) {
        await removeOperation(operation.id);
        success++;
        continue;
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
        await removeOperation(operation.id);
        failed++;
        continue;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      const nextRetry = operation.retryCount + 1;
      operation.retryCount = nextRetry;
      await writeQueue(operations);
      failed++;
      console.warn("[Offline Sync] retry", operation.type, nextRetry, error);
    }
  }

  return { success, failed };
}

export function useAutoSync() {
  const online = useOnlineStatus();
  useEffect(() => {
    if (!online) return;

    const syncNow = async () => {
      try {
        if ((await readQueue()).length > 0) await syncPendingOperations();
      } catch (error) {
        console.warn("[Offline Sync] sync unavailable", error);
      }
    };

    void syncNow();
    const interval = window.setInterval(() => void syncNow(), SYNC_INTERVAL);
    return () => window.clearInterval(interval);
  }, [online]);
}

export function queueWorkoutLog(workoutData: unknown) {
  return queueOperation({ type: "workout-log", method: "POST", endpoint: "/api/workout-logs", data: workoutData });
}

export function queueMeasurement(measurementData: unknown) {
  return queueOperation({ type: "measurement", method: "POST", endpoint: "/api/measurements", data: measurementData });
}

export function queueCheckin(checkinData: unknown) {
  return queueOperation({ type: "checkin", method: "POST", endpoint: "/api/checkins", data: checkinData });
}

export function queueMessage(messageData: unknown) {
  return queueOperation({ type: "message", method: "POST", endpoint: "/api/messages", data: messageData });
}

export function getPendingCount(): number {
  return readLegacyQueue().length;
}

export function clearAllOperations(): void {
  if (typeof window === "undefined") return;
  clearLegacyQueue();
  void replaceIndexedQueue([]).catch(() => undefined);
}