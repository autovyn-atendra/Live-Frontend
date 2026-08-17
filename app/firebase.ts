
import * as firebase from "firebase/app";
import { getToken, getMessaging, onMessage } from "firebase/messaging";

const firebaseCloudMessaging = {
  tokenInlocalforage: async () => {
    return localStorage.getItem("fcm_token");
  },
  init: async function () {
    if (!firebase.getApps().length) {
      firebase.initializeApp({
        apiKey: "AIzaSyDyOoCztd9H8LUA2esWnWSpx7mmR8-CpgU",
        authDomain: "autovyncloud.firebaseapp.com",
        projectId: "autovyncloud",
        storageBucket: "autovyncloud.appspot.com",
        messagingSenderId: "778820281821",
        appId: "1:778820281821:web:a388520e7ddff1d4c74234",
        measurementId: "G-3M12JML7BT"
      });
      try {
        const messaging = getMessaging();
        const tokenInLocalForage = await this.tokenInlocalforage();

        if (tokenInLocalForage !== null) {
          return tokenInLocalForage;
        }

        const status = await Notification.requestPermission();
        if (status && status === "granted") {
          const fcm_token = await getToken(messaging, { vapidKey: "BCPKtCS_DQkuoiN9aCOPKvW1SILQkR1ve8FWnu_kREFH--IPZZNC9tT9eH1S4ODplfyYf98A1iw-dlaNe0vamSk" });
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
          const fcm_token = await getToken(messaging, { vapidKey: "BCPKtCS_DQkuoiN9aCOPKvW1SILQkR1ve8FWnu_kREFH--IPZZNC9tT9eH1S4ODplfyYf98A1iw-dlaNe0vamSk" });
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

export {firebaseCloudMessaging};
