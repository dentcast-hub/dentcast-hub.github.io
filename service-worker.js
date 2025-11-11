// service-worker.js

// ✅ فایربیس غیرفعال شده (فقط به عنوان بکاپ نگه‌داشته شده)
// importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging-compat.js');

// const firebaseConfig = {
//   apiKey: "AIzaSyBEolrSzV6DuvaSX1VQ9zdr8R6Tj7t8uZw",
//   authDomain: "dentcast-d2128.firebaseapp.com",
//   projectId: "dentcast-d2128",
//   storageBucket: "dentcast-d2128.firebasestorage.app",
//   messagingSenderId: "663952391293",
//   appId: "1:663952391293:web:87b386456860dd17b90514"
// };

// firebase.initializeApp(firebaseConfig);
// const messaging = firebase.messaging();

// messaging.onBackgroundMessage(function (payload) {
//   console.log('[service-worker.js] Received background message ', payload);
//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/favicon-192.png'
//   };
//   return self.registration.showNotification(notificationTitle, notificationOptions);
// });

/* ✅ منطق PWA (کش ساده) */
self.addEventListener('install', (event) => {
  console.log('DentCast PWA Service Worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('DentCast PWA Service Worker activated.');
});

self.addEventListener('fetch', (event) => {
  // فقط درخواست‌های GET رو کش کن که با POSTهای نجوا قاطی نشه
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open('dentcast-cache-v1').then((cache) => {
      return cache.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request)
            .then((networkResponse) => {
              if (event.request.url.startsWith('http')) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => response)
        );
      });
    })
  );
});

/* 🔔 Najva push integration */
try {
  importScripts('https://van.najva.com/static/js/najva-sw.js');
  console.log('Najva service worker loaded successfully.');
} catch (e) {
  console.error('Najva SW load failed:', e);
}
