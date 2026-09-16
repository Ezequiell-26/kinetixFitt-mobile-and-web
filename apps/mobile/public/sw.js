/* KINETIXFITT Service Worker — Workbox offline-first */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

const CACHE_VERSION = 'kinetixfitt-v5-workbox';
const OFFLINE_URL = '/offline.html';

if (self.workbox) {
  console.log('[SW] Workbox loaded — ' + CACHE_VERSION);

  workbox.core.setCacheNameDetails({
    prefix: 'kinetixfitt',
    suffix: CACHE_VERSION,
    precache: 'precache',
    runtime: 'runtime',
  });

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  workbox.precaching.precacheAndRoute([
    { url: '/', revision: 'v5' },
    { url: '/login', revision: 'v5' },
    { url: '/offline.html', revision: 'v5' },
    { url: '/manifest.json', revision: 'v5' },
    { url: '/client/dashboard', revision: 'v5' },
    { url: '/client/workout', revision: 'v5' },
    { url: '/client/progress', revision: 'v5' },
    { url: '/client/nutrition', revision: 'v5' },
    { url: '/icons/icon-192.png', revision: 'v5' },
    { url: '/icons/icon-512.png', revision: 'v5' },
  ]);

  workbox.precaching.installListener;
  workbox.precaching.cleanupOutdatedCaches();

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/exercises/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'exercises-cache-' + CACHE_VERSION,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'image' &&
      (url.pathname.includes('/exercises') || url.pathname.includes('/data/')),
    new workbox.strategies.CacheFirst({
      cacheName: 'exercises-images-' + CACHE_VERSION,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache-' + CACHE_VERSION,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 5 * 60,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font' ||
      request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-assets-' + CACHE_VERSION,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache-' + CACHE_VERSION,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 24 * 60 * 60,
        }),
      ],
    })
  );

  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document' || event.request.mode === 'navigate') {
      const cached = await caches.match(OFFLINE_URL);
      if (cached) return cached;
      return caches.match('/');
    }
    return Response.error();
  });

  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-' + CACHE_VERSION,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );
} else {
  console.warn('[SW] Workbox no cargó — fallback manual mínimo');
  self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open(CACHE_VERSION)
        .then((c) => c.addAll([OFFLINE_URL, '/', '/login']))
        .then(() => self.skipWaiting())
    );
  });
  self.addEventListener('activate', (e) => {
    e.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        ))
        .then(() => self.clients.claim())
    );
  });
}

// Persistent offline outbox. Only same-origin, known JSON mutations are queued.
const OUTBOX_DB = 'kinetixfitt-offline';
const OUTBOX_STORE = 'mutations';
const OUTBOX_VERSION = 1;
const SYNC_TAG = 'sync-api-mutations';
const MAX_RETRIES = 5;

function shouldQueueMutation(request) {
  const url = new URL(request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return false;
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return false;

  const safePaths = [
    '/api/workout-logs',
    '/api/checkins',
    '/api/progress',
    '/api/progress-measurements',
    '/api/progress-photos',
  ];

  return safePaths.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
}

function openOutboxDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OUTBOX_DB, OUTBOX_VERSION);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const store = db.createObjectStore(OUTBOX_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function enqueueMutation(request) {
  const body = await request.clone().text();
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    const normalized = key.toLowerCase();
    if (normalized === 'authorization' || normalized === 'cookie') continue;
    headers[key] = value;
  }

  const record = {
    url: request.url,
    method: request.method,
    headers,
    body,
    credentials: 'include',
    createdAt: Date.now(),
    retries: 0,
  };

  const db = await openOutboxDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    tx.objectStore(OUTBOX_STORE).add(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Outbox write failed'));
  });
  db.close();

  try {
    await self.registration.sync.register(SYNC_TAG);
  } catch (error) {
    console.warn('[SW] Background Sync unavailable:', error);
  }
}

async function readOutbox() {
  const db = await openOutboxDb();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const request = tx.objectStore(OUTBOX_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Outbox read failed'));
  });
  db.close();
  return items;
}

async function deleteOutboxItem(id) {
  const db = await openOutboxDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    tx.objectStore(OUTBOX_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Outbox delete failed'));
  });
  db.close();
}

async function updateOutboxRetries(id, retries) {
  const db = await openOutboxDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result;
      if (record) {
        record.retries = retries;
        store.put(record);
      }
    };
    request.onerror = () => reject(request.error || new Error('Outbox update failed'));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Outbox update transaction failed'));
  });
  db.close();
}

async function flushOutbox() {
  const items = await readOutbox();

  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
        credentials: item.credentials || 'include',
      });

      if (response.ok || (response.status >= 300 && response.status < 400)) {
        await deleteOutboxItem(item.id);
        continue;
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
        await deleteOutboxItem(item.id);
        console.warn('[SW] Dropped non-retryable mutation:', item.url, response.status);
        continue;
      }

      const retries = Number(item.retries || 0) + 1;
      if (retries >= MAX_RETRIES) {
        await deleteOutboxItem(item.id);
        console.warn('[SW] Dropped mutation after max retries:', item.url);
      } else {
        await updateOutboxRetries(item.id, retries);
      }
    } catch (error) {
      const retries = Number(item.retries || 0) + 1;
      if (retries >= MAX_RETRIES) {
        await deleteOutboxItem(item.id);
        console.warn('[SW] Dropped mutation after max retries:', item.url);
      } else {
        await updateOutboxRetries(item.id, retries);
      }
      console.error('[SW] Background sync failed:', error);
    }
  }
}

self.addEventListener('fetch', (event) => {
  if (!shouldQueueMutation(event.request)) return;

  event.respondWith(
    fetch(event.request.clone()).catch(async () => {
      try {
        await enqueueMutation(event.request);
        return new Response(JSON.stringify({ offline: true, queued: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('[SW] Failed to persist offline mutation:', error);
        return new Response(JSON.stringify({ offline: true, queued: false }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(flushOutbox());
});

self.addEventListener('online', () => {
  flushOutbox().catch((error) => console.warn('[SW] Online flush failed:', error));
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'KINETIXFITT';
  const options = {
    body: data.body ?? 'Nueva notificación',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url ?? '/client/dashboard', timestamp: Date.now() },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Descartar' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const urlToOpen = event.notification.data?.url ?? '/client/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
    const urlToOpen = event.data.url || '/client/dashboard';
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const client of clients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) return client.focus();
        }
        return self.clients.openWindow(urlToOpen);
      })
    );
  }
});