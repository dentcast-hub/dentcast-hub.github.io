// app.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging"; // 👈 ماژول‌های لازم برای پیام‌رسانی

// Your web app's Firebase configuration (بر اساس اطلاعات شما)
const firebaseConfig = {
  apiKey: "AIzaSyBEolrSzV6DuvaSX1VQ9zdr8R6Tj7t8uZw",
  authDomain: "dentcast-d2128.firebaseapp.com",
  projectId: "dentcast-d2128",
  storageBucket: "dentcast-d2128.firebasestorage.app",
  messagingSenderId: "663952391293",
  appId: "1:663952391293:web:d2d61bfcdb63e111b90514",
  measurementId: "G-7ECTEMHN8B"
};

// VAPID Public Key (کلیدی که شما تولید کردید)
const VAPID_PUBLIC_KEY = "BJeETgGZSTEEOuMVbPc2RMy41puVvKPY6gMcersYll_Mguo7vScLEJcAq8Tx0ehGztLc_P8wMoLONDWvtrask_s";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // ابزارهای جانبی

// 🔥 منطق پوش نوتیفیکیشن
const messaging = getMessaging(app);

// تابع برای درخواست اجازه و گرفتن توکن
async function requestPermissionAndGetToken() {
    try {
        // 1. درخواست اجازه نوتیفیکیشن از کاربر
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted.");

            // 2. گرفتن توکن دستگاه با استفاده از VAPID Key
            const currentToken = await getToken(messaging, { 
                vapidKey: VAPID_PUBLIC_KEY 
            });

            if (currentToken) {
                console.log("FCM registration token:", currentToken);
                
                // ⚠️ مهم: این توکن (currentToken) را باید به سرور خود بفرستی
                // تا بعداً بتوانی با استفاده از آن به این دستگاه پیام بفرستی.
                // مثال: sendTokenToServer(currentToken);
            } else {
                console.log("No registration token available. Request permission to generate one.");
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
    // نمایش نوتیفیکیشن داخل خود وبسایت (اختیاری)
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
    };
    new Notification(notificationTitle, notificationOptions);
});

// شروع فرآیند
requestPermissionAndGetToken();
