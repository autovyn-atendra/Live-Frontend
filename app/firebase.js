
import * as firebase from "firebase/app";
import { getToken, getMessaging, onMessage } from "firebase/messaging";

const firebaseCloudMessaging = {
  tokenInlocalforage: async () => {
    return localStorage.getItem("fcm_token");
  },
  init: async function () {
    if (!firebase.getApps().length) {
      firebase.initializeApp({
        apiKey: "AIzaSyC0SfjYzENSqWW9fIlVKz8KIWPEWo0cKKI",
        authDomain: "autovyn-cloud.firebaseapp.com",
        projectId: "autovyn-cloud",
        storageBucket: "autovyn-cloud.appspot.com",
        messagingSenderId: "434903638965",
        appId: "1:434903638965:web:c3892b49f43c60e4b46ffc",
        measurementId: "G-L35L5JCZ72"
      });
      try {
        const messaging = getMessaging();
        const tokenInLocalForage = await this.tokenInlocalforage();

        if (tokenInLocalForage !== null) {
          return tokenInLocalForage;
        }

        const status = await Notification.requestPermission();
        if (status && status === "granted") {
          const fcm_token = await getToken(messaging, { vapidKey: "BDWoysBICZf5cymAxFyCg6ebSLtNfEpckSjitfbL_oKmYQtifFPQgfo4N-aaGHacAw6NobDWA7BeMceGPr0-uKM"});
          console.log(fcm_token)
          if (fcm_token) {
            localStorage.setItem("fcm_token", fcm_token);
            return fcm_token;
          }
        }
      }
      catch (error) {
        return error;
      }
    } else {
      try {
        const tokenInLocalForage = await this.tokenInlocalforage();

        if (tokenInLocalForage !== null) {
          return tokenInLocalForage;
        }
        const messaging = getMessaging();
        const status = await Notification.requestPermission();
        if (status && status === "granted") {
          const fcm_token = await getToken(messaging, { vapidKey: "BDWoysBICZf5cymAxFyCg6ebSLtNfEpckSjitfbL_oKmYQtifFPQgfo4N-aaGHacAw6NobDWA7BeMceGPr0-uKM" });
          if (fcm_token) {
            localStorage.setItem("fcm_token", fcm_token);
            return fcm_token;
          }
        }
      }
      catch (error) {
        return error;
      }
    }
  },
  getMessage: async function () {
    if (firebase.getApps().length > 0) {
      try {
        const messaging = getMessaging();
        onMessage(messaging, payload => {
          console.log("Message Recieved", payload);
        })
      }
      catch (error) {

      }
    }
  }
}

export { firebaseCloudMessaging };
