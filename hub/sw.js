// ─── Big Backth Hub service worker ───────────────────────────────────────────
// Cache-first strategy for app shell so the Hub works offline once visited.
const CACHE = 'bigbacks-hub-v1';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './js/main.js',
  './shared-profile.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Skip cross-origin (fonts, CDNs) — let the browser handle them
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Stale-while-revalidate
        fetch(e.request).then(net => {
          if (net && net.ok) caches.open(CACHE).then(c => c.put(e.request, net));
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(net => {
        if (net && net.ok) {
          const copy = net.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return net;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
