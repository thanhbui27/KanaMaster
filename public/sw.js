const CACHE_NAME = "kanamaster-shell-v14";
const APP_PAGES = [
  "/",
  "/learn",
  "/practice",
  "/practice/handwriting",
  "/practice/recognition",
  "/practice/typing",
  "/practice/speed",
  "/review",
  "/progress"
];
const APP_SHELL = [
  ...APP_PAGES,
  "/offline.html",
  "/manifest.webmanifest",
  "/handwriting/kana-templates.png?v=2",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);

      // Cache the hashed Next.js CSS/JS referenced by the prerendered shell so
      // the very first installed launch works without a network connection.
      const pageHtml = await Promise.all(
        APP_PAGES.map(async (page) => (await cache.match(page))?.text() ?? "")
      );
      const assetUrls = pageHtml.flatMap((html) =>
        [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
          .map((match) => match[1].replaceAll("&amp;", "&"))
          .filter((path) => path.startsWith("/_next/static/"))
      );
      await cache.addAll([...new Set(assetUrls)]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/")) || caches.match("/offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
