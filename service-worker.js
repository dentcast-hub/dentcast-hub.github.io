self.addEventListener('install', (event) => {
  console.log('DentCast Service Worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('DentCast Service Worker activated.');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('dentcast-cache').then((cache) => {
      return cache.match(event.request).then((response) => {
        return response || fetch(event.request).then((networkResponse) => {
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});
