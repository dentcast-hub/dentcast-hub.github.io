// service-worker.js
// DentCast PWA — NO-CACHE strategy
//
// Everything is served straight from the network. The worker keeps:
//   1. a fetch listener only so the PWA stays installable (it does not
//      intercept or cache anything — the browser's normal HTTP caching
//      semantics apply untouched);
//   2. an activate step that deletes the caches THIS worker ever created, so
//      returning visitors shed the old cache-first storage. It deliberately
//      does NOT clear the whole origin: `caches` is origin-wide, and the Plus
//      worker's app shell (dcp-*, scope /plus/) lives in the same storage.
//      Wiping that shell here would leave /plus/ uncached until its own worker
//      reinstalls — which only happens when plus/sw.js itself changes, not when
//      this file is re-stamped. The blast radius grew once this worker started
//      registering site-wide rather than on the homepage alone;
//   3. the CACHE_NAME constant, kept solely because tools/stamp-version.py
//      re-stamps it on each publish — the byte change makes browsers fetch
//      and activate the new worker promptly.

const CACHE_NAME = 'dentcast-assets-eb84f910df';

/* Caches owned by THIS worker. tools/stamp-version.py rewrites CACHE_NAME on
   each publish, so the old name is never known here — match on the stable
   prefix instead and leave every other owner's storage untouched. */
const OWNED_CACHE_PREFIX = 'dentcast-assets-';

/* نصب */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

/* فعال‌سازی — حذف کش‌های قدیمیِ متعلق به همین ورکر (نه کش /plus/) */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(OWNED_CACHE_PREFIX))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* fetch — عمداً بدون مداخله: شبکه‌ی خالص، بدون هیچ کشی */
self.addEventListener('fetch', () => {});
