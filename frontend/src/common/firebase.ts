import firebase from "firebase/app";
import { once } from "lodash-es";

export interface IFirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export const initializeFirebase = once((firebaseConfig: IFirebaseConfig) => {
    firebase.initializeApp(firebaseConfig);
});

export type EntityWithId<T> = T & { id: string };
export type Callback<T> = (value: T) => void;
export type Cancelable = () => void;
