import { initializeFirebase } from "./common/firebase";
import { FIREBASE_CONFIG } from "./common/firebaseConfig";
import firebase from "firebase/app";
import "firebase/messaging";

const { publicVapidKey, ...rest } = FIREBASE_CONFIG;
firebase.initializeApp(rest);
const messaging = firebase.messaging();
messaging.usePublicVapidKey(publicVapidKey);
messaging.setBackgroundMessageHandler(payload => {
    return new ServiceWorkerRegistration().showNotification("Hello world", {
        body: payload.data,
    });
});
