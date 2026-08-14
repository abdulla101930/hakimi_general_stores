const CACHE_NAME = 'hakimi-pwa-v8-network-first';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './logo.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        ASSETS_TO_CACHE.map(async (asset) => {
          try {
            const res = await fetch(asset, { cache: 'no-cache' });
            if (res && res.ok) await cache.put(asset, res.clone());
          } catch (err) {
            console.warn('[SW] Skipping asset:', asset, err);
          }
        })
      );
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(event.request, { cache: 'no-store' });
          if (res && res.ok) {
            const copy = res.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put('./index.html', copy);
          }
          return res;
        } catch {
          const cached = await caches.match('./index.html');
          if (cached) return cached;
          return new Response(
            '<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:40px">You are offline. Please check your connection and retry.</body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html' } }
          );
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      try {
        const res = await fetch(event.request, { cache: 'no-cache' });
        if (res && res.ok) {
          const copy = res.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, copy);
        }
        return res;
      } catch {
        if (cached) return cached;
        return new Response('', { status: 408, statusText: 'Network Request Failed' });
      }
    })()
  );
});
