const CACHE_NAME = 'dentcast-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/noteCast/',
  '/favicon-32.png',
  '/favicon-192.png',
  '/favicon-512.png'
];

// نصب و کش اولیه
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// واکنش به درخواست‌ها (فچ از کش یا اینترنت)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// حذف کش‌های قدیمی هنگام آپدیت
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});
