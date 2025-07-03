const cacheName = "Glowcalc-v2";
const assets = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./number click.wav",
  "./operators.wav",
  "./equals to.wav",
  "./error.wav",
  "./history.wav",
  "./toggle scientific.wav",
  "./backspace.wav",
  "./theme.wav",
  "./trash.wav",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(assets))
  );
  self.skipWaiting(); // Force immediate activation
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== cacheName) return caches.delete(key);
      }))
    )
  );
  self.clients.claim(); // Take control immediately
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((liveResponse) => {
        return caches.open(cacheName).then((cache) => {
          cache.put(event.request, liveResponse.clone());
          return liveResponse;
        });
      });
    })
  );
});
