// firebase-messaging-sw.js

// SDKها را با سینتکس مخصوص Service Worker لود می‌کند
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js');

// تنظیمات فایربیس (بر اساس اطلاعات شما)
const firebaseConfig = {
    apiKey: "AIzaSyBEolrSzV6DuvaSX1VQ9zdr8R6Tj7t8uZw",
    authDomain: "dentcast-d2128.firebaseapp.com",
    projectId: "dentcast-d2128",
    storageBucket: "dentcast-d2128.firebasestorage.app",
    messagingSenderId: "663952391293",
    appId: "1:663952391293:web:d2d61bfcdb63e111b90514"
};

// مقداردهی اولیه فایربیس
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// هندل کردن پیام‌های دریافتی در حالت Background
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // اگر پیام دارای بخش notification باشد
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png' // 👈 مطمئن شوید یک فایل icon.png در Root پروژه دارید
        // می‌توانید داده‌های اضافه را هم در data قرار دهید
        // data: payload.data
    };

    // نمایش نوتیفیکیشن به کاربر
    return self.registration.showNotification(notificationTitle, notificationOptions);
});
