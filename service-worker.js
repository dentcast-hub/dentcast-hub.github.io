// service-worker.js
// DentCast PWA — Safe Content Strategy

const CACHE_NAME = 'dentcast-assets-v2';

/* نصب */
self.addEventListener('install', (event) => {
  console.log('DentCast SW installed');
  self.skipWaiting();
});

/* فعال‌سازی */
self.addEventListener('activate', (event) => {
  console.log('DentCast SW activated');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* fetch logic */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const accept = event.request.headers.get('accept') || '';

  /* 🔴 HTML → Network First (مهم‌ترین بخش) */
  if (accept.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ❌ این فایل هرگز نباید کش شود
if (event.request.url.includes('Dentcast-brain.txt')) {
  event.respondWith(fetch(event.request, { cache: "no-store" }));
  return;
}

/* 🟢 Assets → Cache First */
event.respondWith(
  caches.open(CACHE_NAME).then((cache) => {
    return cache.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (
          event.request.url.startsWith('http') &&
          networkResponse.status === 200
        ) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      });
    });
  })
);

  /* 🟢 Assets → Cache First */
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (
            event.request.url.startsWith('http') &&
            networkResponse.status === 200
          ) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});
