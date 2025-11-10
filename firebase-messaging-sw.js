importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "🔹اینجا apiKey",
  authDomain: "🔹authDomain",
  projectId: "🔹projectId",
  storageBucket: "🔹storageBucket",
  messagingSenderId: "🔹messagingSenderId",
  appId: "🔹appId"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // اختیاری
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
