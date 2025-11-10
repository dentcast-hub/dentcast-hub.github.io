// apps.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging"; // 👈 ماژول‌های لازم

// Your web app's Firebase configuration
const firebaseConfig = {
  // ... (تنظیمات فایربیس شما)
  apiKey: "AIzaSyBEolrSzV6DuvaSX1VQ9zdr8R6Tj7t8uZw",
  authDomain: "dentcast-d2128.firebaseapp.com",
  projectId: "dentcast-d2128",
  storageBucket: "dentcast-d2128.firebasestorage.app",
  messagingSenderId: "663952391293",
  appId: "1:663952391293:web:d2d61bfcdb63e111b90514",
  measurementId: "G-7ECTEMHN8B"
};

// VAPID Public Key
const VAPID_PUBLIC_KEY = "BJeETgGZSTEEOuMVbPc2RMy41puVvKPY6gMcersYll_Mguo7vScLEJcAq8Tx0ehGztLc_P8wMoLONDWvtrask_s";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// تابع برای درخواست اجازه و گرفتن توکن
async function requestPermissionAndGetToken() {
    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted.");

            // 💡 این مهمترین بخش است: به Firebase میگیم سرویس ورکر رو پیدا کنه
            const currentToken = await getToken(messaging, { 
                vapidKey: VAPID_PUBLIC_KEY,
                // ⚠️ به Firebase می‌گیم که سرویس ورکر PWA رو بگیره
                serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/service-worker.js')
            });

            if (currentToken) {
                console.log("FCM registration token:", currentToken);
                // ⚠️ اینجا باید توکن رو به سرور بفرستی 
            } else {
                console.log("No registration token available.");
            }
        } else {
            console.log("Unable to get permission to notify.");
        }
    } catch (err) {
        console.error("An error occurred while retrieving token: ", err);
    }
}

// 3. هندل کردن پیام‌های دریافتی وقتی کاربر در وبسایت است (Foreground)
onMessage(messaging, (payload) => {
    console.log("Message received while in foreground: ", payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = { body: payload.notification.body };
    new Notification(notificationTitle, notificationOptions);
});

// شروع فرآیند
requestPermissionAndGetToken();
