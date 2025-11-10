// service-worker.js

// 🚨 بخش جدید فایربیس: Import کردن SDKهای فایربیس (نسخه 12.5.0)
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging-compat.js');

// 🔑 تنظیمات فایربیس شما (بر اساس آخرین اطلاعات)
const firebaseConfig = {
    apiKey: "AIzaSyBEolrSzV6DuvaSX1VQ9zdr8R6Tj7t8uZw",
    authDomain: "dentcast-d2128.firebaseapp.com",
    projectId: "dentcast-d2128",
    storageBucket: "dentcast-d2128.firebasestorage.app",
    messagingSenderId: "663952391293",
    appId: "1:663952391293:web:87b386456860dd17b90514"
};

// مقداردهی اولیه فایربیس
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 🔔 هندل کردن پیام‌های دریافتی در حالت Background (منطق فایربیس)
messaging.onBackgroundMessage(function(payload) {
    console.log('[service-worker.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon-192.png'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});
// 🚨 پایان بخش فایربیس

// ⚙️ منطق PWA شما (کش کردن)
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
