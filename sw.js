/* Vamos web app: keeps all files of the app on the phone, so it opens and works without internet.
   VERSION and FILES are filled in by tools/build_web.py; a new VERSION (any file changed) makes the phone fetch the new
   files and drop the old ones. Requests to other sites (DeepSeek) go straight to the network. */
var VERSION = "vamos-1.3.4-1027963dd7";
var REC = 'vamos-rec-v1';     // the recordings saved by Preferences → Offline recordings (app.js); kept across updates
var FILES = ["./", "app.js", "check.js", "data/dict.js", "data/sentences.js", "data/words.js", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "index.html", "manifest.webmanifest", "online.js", "styles.css", "web.css", "web.js"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));     // fresh from the server, not from the browser's HTTP cache
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== REC && k.indexOf('vamos-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\.(m4a|ogg|mp3)$/.test(url.pathname)) {
    // recordings: from the network, unless the app marks them ?off=1 (all saved): then from the saved copy
    if (!/[?&]off=1/.test(url.search)) return;
    e.respondWith(caches.open(REC).then(function (c) { return c.match(url.origin + url.pathname); }).then(function (hit) {
      return hit ? part(req, hit) : fetch(req);
    }));
    return;
  }
  var page = req.mode === 'navigate';
  if (page && !/\/(index\.html)?$/.test(url.pathname)) return;      // other pages of the site (sound-test.html): from the network
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(page ? './' : req, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req).then(function (r) {
        if (r && r.ok && !page && url.pathname.indexOf('/sw.js') < 0) c.put(req, r.clone());
        return r;
      }).catch(function () { return page ? c.match('index.html') : Response.error(); });
    });
  }));
});

/* Safari asks for a recording in parts (Range: bytes=0-1, then the rest): answer with that part of the saved file */
function part(req, resp) {
  var range = req.headers.get('range');
  if (!range) return resp;
  return resp.arrayBuffer().then(function (buf) {
    var size = buf.byteLength, m = /^bytes=(\d*)-(\d*)$/.exec(range.trim()), start, end;
    if (!m || (!m[1] && !m[2])) { start = 0; end = size - 1; }
    else if (!m[1]) { start = Math.max(0, size - +m[2]); end = size - 1; }          // the last n bytes
    else { start = +m[1]; end = m[2] ? Math.min(+m[2], size - 1) : size - 1; }
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    return new Response(buf.slice(start, end + 1), { status: 206, headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'audio/mp4', 'Content-Length': String(end - start + 1),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Accept-Ranges': 'bytes' } });
  });
}
