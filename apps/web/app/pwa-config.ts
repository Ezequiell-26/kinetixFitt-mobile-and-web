/**
 * KinetixFitt PWA configuration.
 * Client-side helpers for installability, push and durable offline mutation retries.
 */

export const manifest = {
  name: "KinetixFitt - Tu Entrenador Inteligente",
  short_name: "KinetixFitt",
  description: "Plataforma de fitness para entrenamiento, progreso y coaching.",
  start_url: "/",
  display: "standalone",
  background_color: "#0f172a",
  theme_color: "#10b981",
  orientation: "portrait-primary",
  icons: [
    { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "maskable any" },
    { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "maskable any" },
    { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "maskable any" },
    { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "maskable any" },
    { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "maskable any" },
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable any" },
    { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "maskable any" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable any" },
  ],
  categories: ["health", "fitness", "lifestyle"],
  lang: "es",
  dir: "ltr",
  scope: "/",
  prefer_related_applications: false,
};

export interface CacheStrategy {
  pattern: RegExp;
  strategy: "cache-first" | "network-first" | "stale-while-revalidate" | "network-only" | "cache-only";
  cacheName: string;
  maxEntries?: number;
  maxAgeSeconds?: number;
}

export const cacheStrategies: CacheStrategy[] = [
  {
    pattern: /^\/$/,
    strategy: "cache-first",
    cacheName: "app-shell",
    maxEntries: 10,
    maxAgeSeconds: 86400 * 7,
  },
  {
    pattern: /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/,
    strategy: "cache-first",
    cacheName: "static-assets",
    maxEntries: 200,
    maxAgeSeconds: 86400 * 30,
  },
  {
    // Never persist authenticated API responses in the browser cache.
    pattern: /\/api\//,
    strategy: "network-only",
    cacheName: "api-network-only",
  },
];

export const offlinePage = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sin conexión · KinetixFitt</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f172a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px}
    main{width:min(560px,100%);text-align:center;padding:32px;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(255,255,255,.04)}
    h1{margin:0 0 12px;font-size:32px}p{color:#94a3b8;line-height:1.6}button{margin-top:14px;border:0;border-radius:12px;padding:12px 18px;font-weight:700;cursor:pointer}
  </style>
</head>
<body>
  <main>
    <div aria-hidden="true" style="font-size:48px">◌</div>
    <h1>Sin conexión</h1>
    <p>No hay conexión disponible. Las operaciones pendientes se conservarán y volverán a intentarse cuando recuperes internet.</p>
    <button onclick="window.location.reload()">Reintentar</button>
  </main>
</body>
</html>`;

export type SyncTaskType = "workout-log" | "nutrition-entry" | "progress-update" | "message-send";

export interface SyncTask {
  id: string;
  type: SyncTaskType;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  nextAttemptAt?: number;
}

const MAX_TASK_BODY_BYTES = 256 * 1024;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function taskEndpoint(task: SyncTask) {
  const endpoint = typeof task.data.endpoint === "string" ? task.data.endpoint : null;
  if (!endpoint || !endpoint.startsWith("/api/")) {
    throw new Error(`Missing safe API endpoint for sync task ${task.id}`);
  }
  return endpoint;
}

function taskBody(task: SyncTask) {
  const { endpoint: _endpoint, ...body } = task.data;
  return body;
}

function bodySizeBytes(body: Record<string, unknown>) {
  return new TextEncoder().encode(JSON.stringify(body)).byteLength;
}

export class BackgroundSyncManager {
  private readonly STORAGE_KEY = "kinetix_sync_queue";
  private readonly MAX_RETRIES = 5;
  private processing = false;

  public constructor() {
    if (isBrowser()) {
      window.addEventListener("online", () => {
        void this.processQueue();
      });
    }
  }

  public async queueTask(task: Omit<SyncTask, "timestamp" | "retryCount">): Promise<void> {
    if (!isBrowser()) return;

    const endpoint = typeof task.data.endpoint === "string" ? task.data.endpoint : null;
    if (!endpoint || !endpoint.startsWith("/api/")) {
      throw new Error(`Missing safe API endpoint for sync task ${task.id}`);
    }
    if (bodySizeBytes(taskBody(task as SyncTask)) > MAX_TASK_BODY_BYTES) {
      throw new Error(`Sync task ${task.id} exceeds the 256 KB offline payload limit`);
    }

    const queue = this.getQueue();
    const existing = queue.some((item) => item.id === task.id);
    if (existing) return;

    queue.push({
      ...task,
      timestamp: Date.now(),
      retryCount: 0,
    });
    this.saveQueue(queue);

    if (navigator.onLine) {
      void this.processQueue();
    }
  }

  public async processQueue(): Promise<void> {
    if (!isBrowser() || this.processing || !navigator.onLine) return;
    this.processing = true;

    try {
      const queue = this.getQueue();
      const remaining: SyncTask[] = [];
      const now = Date.now();

      for (const task of queue) {
        if (task.nextAttemptAt && task.nextAttemptAt > now) {
          remaining.push(task);
          continue;
        }

        try {
          await this.executeTask(task);
        } catch (error) {
          const retryCount = task.retryCount + 1;
          const retryable = error instanceof SyncRetryableError;

          if (retryable && retryCount < this.MAX_RETRIES) {
            remaining.push({
              ...task,
              retryCount,
              nextAttemptAt: Date.now() + Math.min(60_000, 2_000 * 2 ** (retryCount - 1)),
            });
          } else {
            console.error("[PWA SYNC] task dropped", {
              id: task.id,
              type: task.type,
              reason: error instanceof Error ? error.message : "unknown error",
              retryCount,
            });
          }
        }
      }

      this.saveQueue(remaining);
    } finally {
      this.processing = false;
    }
  }

  private async executeTask(task: SyncTask): Promise<void> {
    const endpoint = taskEndpoint(task);
    const body = taskBody(task);
    if (bodySizeBytes(body) > MAX_TASK_BODY_BYTES) {
      throw new Error(`Sync task ${task.id} exceeds the 256 KB offline payload limit`);
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500) {
          throw new SyncRetryableError(`Retryable server error ${response.status}`);
        }
        throw new Error(`Request rejected ${response.status}`);
      }
    } catch (error) {
      if (error instanceof SyncRetryableError) throw error;
      if (error instanceof TypeError || (error instanceof Error && /network|timeout|failed to fetch/i.test(error.message))) {
        throw new SyncRetryableError(error instanceof Error ? error.message : "Network request failed");
      }
      throw error;
    }
  }

  private getQueue(): SyncTask[] {
    if (!isBrowser()) return [];
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((value): value is SyncTask => {
        if (!value || typeof value !== "object") return false;
        const item = value as Partial<SyncTask>;
        return typeof item.id === "string" && typeof item.type === "string" && typeof item.data === "object" && item.data !== null;
      });
    } catch {
      return [];
    }
  }

  private saveQueue(queue: SyncTask[]): void {
    if (!isBrowser()) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue.slice(-100)));
  }

  public getQueueLength(): number {
    return this.getQueue().length;
  }

  public clearQueue(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

class SyncRetryableError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "SyncRetryableError";
  }
}

export class PushNotificationManager {
  public async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) return "denied";
    return Notification.requestPermission();
  }

  public async subscribe(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

    try {
      const keyResponse = await fetch("/api/push/public-key", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!keyResponse.ok) throw new Error("Push no configurado en el servidor");
      const payload = (await keyResponse.json()) as { publicKey?: string };
      if (!payload.publicKey) throw new Error("Falta la clave pública VAPID");

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(payload.publicKey),
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!response.ok) throw new Error("No se pudo guardar la suscripción push");

      return subscription;
    } catch (error) {
      console.error("[PUSH] subscription failed", error);
      return null;
    }
  }

  public async unsubscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return false;
      const endpoint = encodeURIComponent(subscription.endpoint);
      await subscription.unsubscribe();
      await fetch(`/api/push/subscribe?endpoint=${endpoint}`, {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      });
      return true;
    } catch (error) {
      console.error("[PUSH] unsubscribe failed", error);
      return false;
    }
  }

  public showNotification(title: string, options?: NotificationOptions): void {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    void navigator.serviceWorker?.ready
      .then((registration) => registration.showNotification(title, {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        ...options,
      }))
      .catch(() => undefined);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export class InstallPromptManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private onStateChange?: (installed: boolean) => void;

  public init(onStateChange?: (installed: boolean) => void): void {
    this.onStateChange = onStateChange;

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.onStateChange?.(false);
    });

    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
      this.onStateChange?.(true);
    });
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  public async prompt(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    const prompt = this.deferredPrompt;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    this.deferredPrompt = null;
    return outcome === "accepted";
  }

  public isInstalled(): boolean {
    return window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  }
}

export const syncManager = new BackgroundSyncManager();
export const pushManager = new PushNotificationManager();
export const installManager = new InstallPromptManager();

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    registration.update().catch(() => undefined);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent("kinetix:sw-update-available"));
        }
      });
    });
    return registration;
  } catch (error) {
    console.error("[PWA] service worker registration failed", error);
    return null;
  }
}
