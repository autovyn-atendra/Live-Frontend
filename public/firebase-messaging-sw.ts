"use client"
declare const importScripts: (...urls: string[]) => void;

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyDyOoCztd9H8LUA2esWnWSpx7mmR8-CpgU",
  authDomain: "autovyncloud.firebaseapp.com",
  projectId: "autovyncloud",
  storageBucket: "autovyncloud.appspot.com",
  messagingSenderId: "778820281821",
  appId: "1:778820281821:web:a388520e7ddff1d4c74234",
  measurementId: "G-3M12JML7BT"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
self.addEventListener("message", event => {
  const { type, data } = event.data;
  if (type === "showNotification") {
    const { title, body } = data;
    self.registration.showNotification(title, {
      body: body
    });
    self.registration.showNotification(title);
  }
});