const cacheName = "neon-calculator-v1";
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
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
