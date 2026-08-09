const CACHE_NAME = 'hakimi-pwa-v6-network-only';

// Assets that can be cached for offline fallback (only static icons)
const ASSETS_TO_CACHE = [
  './manifest.webmanifest',
  './logo.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Cache addAll warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Purge ALL existing caches to force fresh download
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ALWAYS fetch HTML, JS, and CSS directly from Network (NO CACHING)
  // This guarantees all deployment updates are visible instantly without incognito mode!
  if (
    event.request.mode === 'navigate' || 
    event.request.headers.get('accept')?.includes('text/html') || 
    url.pathname.endsWith('index.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => {
          return caches.match(event.request) || caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  // Fallback for static image assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => null);
    })
  );
});
