const CACHE = "bigbacks-hub-trip-v2";
const SHELL = [
  "./",
  "./index.html",
  "./icon.svg",
  "./trip-home.css?v=20261014d",
  "./js/main.js?v=20261014d",
  "./js/trip-home.js?v=20261014d",
  "./shared-profile.js?v=20261014d",
  "./manifest.webmanifest",
  "../trip-state.js?v=20261014d",
  "../trip-shell.js?v=20261014d",
  "../trip-theme.css?v=20261014d",
  "../coast.svg?v=20261014d",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("bigbacks-hub-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url),
    scope = new URL(self.registration.scope),
    root = new URL("../", scope);
  const shared = [
    "trip-state.js",
    "trip-shell.js",
    "trip-theme.css",
    "coast.svg",
  ].map((name) => new URL(name, root).pathname);
  if (
    url.origin !== scope.origin ||
    (!url.pathname.startsWith(scope.pathname) && !shared.includes(url.pathname))
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (event.request.mode === "navigate") {
        try {
          const response = await fetch(event.request);
          if (response.ok) await cache.put(event.request, response.clone());
          return response;
        } catch {
          return (await cache.match("./index.html")) || Response.error();
        }
      }
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});
