// service-worker.js
// DentCast PWA — NO-CACHE strategy
//
// Everything is served straight from the network. The worker keeps:
//   1. a fetch listener only so the PWA stays installable (it does not
//      intercept or cache anything — the browser's normal HTTP caching
//      semantics apply untouched);
//   2. an activate step that deletes EVERY cache this site ever created,
//      so returning visitors shed the old cache-first storage;
//   3. the CACHE_NAME constant, kept solely because tools/stamp-version.py
//      re-stamps it on each publish — the byte change makes browsers fetch
//      and activate the new worker promptly.

const CACHE_NAME = 'dentcast-assets-6c24db59ee';

/* نصب */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

/* فعال‌سازی — حذف همه‌ی کش‌های قدیمی */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

/* fetch — عمداً بدون مداخله: شبکه‌ی خالص، بدون هیچ کشی */
self.addEventListener('fetch', () => {});
