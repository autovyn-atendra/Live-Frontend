"use client"

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');



firebase.initializeApp({
  apiKey: "AIzaSyC0SfjYzENSqWW9fIlVKz8KIWPEWo0cKKI",
  authDomain: "autovyn-cloud.firebaseapp.com",
  projectId: "autovyn-cloud",
  storageBucket: "autovyn-cloud.appspot.com",
  messagingSenderId: "434903638965",
  appId: "1:434903638965:web:c3892b49f43c60e4b46ffc",
  measurementId: "G-L35L5JCZ72"
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