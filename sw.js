/* Кэш для мгновенной загрузки и работы без сети.
   При изменении файлов увеличьте номер версии. */
const VERSION = "pm-v1";
const ASSETS = [
  "./", "index.html", "css/style.css", "js/data.js", "js/store.js", "js/admin.js", "js/app.js",
  "img/granta.webp", "img/changan.webp", "img/bora.webp", "img/premium.webp", "img/icon.svg", "manifest.webmanifest",
  "fonts/dela-gothic-one-cyrillic-400-normal.woff2", "fonts/dela-gothic-one-latin-400-normal.woff2",
  "fonts/golos-text-cyrillic-400-normal.woff2", "fonts/golos-text-cyrillic-600-normal.woff2", "fonts/golos-text-cyrillic-700-normal.woff2",
  "fonts/golos-text-latin-400-normal.woff2", "fonts/golos-text-latin-600-normal.woff2", "fonts/golos-text-latin-700-normal.woff2"
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Страница: сначала сеть, при сбое — кэш. Остальное: сначала кэш.
  if (req.mode === "navigate") { e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return r; }).catch(() => caches.match(req).then((r) => r || caches.match("index.html")))); return; }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
});
