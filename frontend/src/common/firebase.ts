import firebase from "firebase/app";
import "firebase/messaging";
import { once } from "lodash-es";

export interface IFirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    publicVapidKey: string;
}

export const initializeFirebase = once((firebaseConfig: IFirebaseConfig) => {
    const { publicVapidKey, ...rest } = firebaseConfig;
    firebase.initializeApp(rest);
    const messaging = firebase.messaging();
    messaging.usePublicVapidKey(publicVapidKey);
    messaging.onTokenRefresh(() => {
        getToken(messaging);
    });
    messaging
        .requestPermission()
        .then(() => {
            console.log("Success");
            getToken(messaging);
        })
        .catch(() => {
            console.log("Error");
        });
    messaging.onMessage(payload => {
        console.log("onMessage", payload);
    });
    navigator.serviceWorker.addEventListener("message", message => console.log(message));
});

function getToken(messaging: firebase.messaging.Messaging) {
    messaging
        .getToken()
        .then(refreshedToken => {
            console.log("Token refreshed.", refreshedToken);
            // Indicate that the new Instance ID token has not yet been sent to the
            // app server.
            // setTokenSentToServer(false);
            // Send Instance ID token to app server.
            // sendTokenToServer(refreshedToken);
            // ...
        })
        .catch(err => {
            console.log("Unable to retrieve refreshed token ", err);
        });
}

export type EntityWithId<T> = T & { id: string };
export type Callback<T> = (value: T) => void;
export type Cancelable = () => void;
