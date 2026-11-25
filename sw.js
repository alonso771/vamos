/* Vamos web app: keeps all files of the app on the phone, so it opens and works without internet.
   VERSION and FILES are filled in by tools/build_web.py; a new VERSION (any file changed) makes the phone fetch the new
   files and drop the old ones. Requests to other sites (DeepSeek) go straight to the network. */
var VERSION = "vamos-1.3-6740c83ef0";
var FILES = ["./", "app.js", "check.js", "data/dict.js", "data/sentences.js", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "index.html", "manifest.webmanifest", "online.js", "styles.css", "web.css", "web.js"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));     // fresh from the server, not from the browser's HTTP cache
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k.indexOf('vamos-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.open(VERSION).then(function (c) {
    var page = req.mode === 'navigate';
    return c.match(page ? './' : req, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req).then(function (r) {
        if (r && r.ok && !page && url.pathname.indexOf('/sw.js') < 0) c.put(req, r.clone());
        return r;
      }).catch(function () { return page ? c.match('index.html') : Response.error(); });
    });
  }));
});
