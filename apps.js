// apps.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging"; 

// 🔑 Your web app's Firebase configuration (بر اساس کد جدید شما)
const firebaseConfig = {
  apiKey: "AIzaSyBEolrSzV6DuvaSX1VQ9zdr8R6Tj7t8uZw",
  authDomain: "dentcast-d2128.firebaseapp.com",
  projectId: "dentcast-d2128",
  storageBucket: "dentcast-d2128.firebasestorage.app",
  messagingSenderId: "663952391293",
  appId: "1:663952391293:web:87b386456860dd17b90514", // 👈 تغییر کرد
  measurementId: "G-86ZP5LNXPV" // 👈 تغییر کرد
};

// VAPID Public Key (بدون تغییر)
const VAPID_PUBLIC_KEY = "BJeETgGZSTEEOuMVbPc2RMy41puVvKPY6gMcersYll_Mguo7vScLEJcAq8Tx0ehGztLc_P8wMoLONDWvtrask_s";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const analytics = getAnalytics(app); // اضافه کردن Analytics

// تابع برای درخواست اجازه و گرفتن توکن
async function requestPermissionAndGetToken() {
    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            const currentToken = await getToken(messaging, { 
                vapidKey: VAPID_PUBLIC_KEY,
                serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/service-worker.js')
            });
            // ... بقیه منطق توکن ...
        }
    } catch (err) {
        // ...
    }
}

// 3. هندل کردن پیام‌های دریافتی وقتی کاربر در وبسایت است (Foreground)
onMessage(messaging, (payload) => {
    // ...
});

// 🚀 شروع فرآیند
window.onload = function() {
    requestPermissionAndGetToken();
};
