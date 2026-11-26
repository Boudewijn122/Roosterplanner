// Bewaart de app op het toestel zodat hij ook zonder internet opent.
// Verhoog VERSION na elke wijziging, dan halen telefoons de nieuwe versie op.
var VERSION = 'rooster-v17';
var FILES = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'data.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  // cache: 'reload' = altijd vers van de server, niet uit de browsercache.
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Eerst het netwerk (altijd de nieuwste planning), anders de bewaarde versie.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   // Supabase e.d. niet via de cache
  // GitHub Pages laat de browser bestanden 10 minuten bewaren; 'no-cache' vraagt
  // altijd even aan de server of er een nieuwere versie is.
  e.respondWith(
    fetch(e.request.mode === 'navigate' ? e.request.url : e.request, { cache: 'no-cache' }).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match(e.request); })
  );
});
