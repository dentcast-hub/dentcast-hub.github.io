// DentCast Plus service worker: APP SHELL ONLY.
// It caches the /plus UI shell (html, css, js modules, the taxonomy index) so the
// installed app opens instantly. It deliberately does NOT cache article content
// or API responses, so there is no false "works offline" claim: user data always
// comes fresh from the API, and the shell shows a normal error when offline.
const CACHE = 'dcp-shell-v1';
const SHELL = [
  '/plus/',
  '/plus/index.html',
  '/plus/cards.html',
  '/plus/plus.css?v=1',
  '/plus/plus-pages.css?v=1',
  '/plus/plus.js?v=1',
  '/plus/js/config.js',
  '/plus/js/util.js',
  '/plus/js/api.js',
  '/plus/js/content-index.js',
  '/plus/js/tree.js',
  '/plus/js/archive.js',
  '/plus/js/login-modal.js',
  '/plus/js/cards-page.js',
  '/plus/js/dashboard-page.js',
  '/plus/js/pwa.js',
  '/plus/content-index.json',
  '/plus/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Only handle same-origin /plus shell requests. Never touch API calls or
  // article pages: those must always hit the network.
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/plus/')) return;

  // Network-first so a fresh shell wins when online; fall back to cache offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/plus/'))),
  );
});
