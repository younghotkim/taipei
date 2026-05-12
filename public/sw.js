/* Conservative service worker for the Taipei trip PWA.
   - never caches /api/* (always network — dynamic data)
   - never touches cross-origin requests (Supabase, Google Maps, etc.)
   - cache-first for content-hashed /_next/static assets
   - network-first for page navigations (so online users always get the latest),
     falling back to cache (then to "/") when offline
   - stale-while-revalidate for other same-origin GETs (icons, manifest, ...)
   Bump CACHE_VERSION to invalidate everything on a new deploy. */

const CACHE_VERSION = "taipei-trip-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(["/"]).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // dynamic API: always network, never cache
  if (url.pathname.startsWith("/api/")) return;
  // leave cross-origin (Supabase storage, Google Maps, open-meteo, ...) untouched
  if (url.origin !== self.location.origin) return;

  // content-hashed Next static assets — safe to cache forever
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // page navigations — network first, fall back to cache, then to the app shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // other same-origin GETs (icons, manifest, fonts ...) — stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
