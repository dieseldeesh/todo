import firebase from "firebase/app";
import "firebase/auth";
import "firebase/storage";
import { IFirebaseConfig, initializeFirebase } from "../common/firebase";
import uuid from "uuid/v4";

export interface IPhotoService {
    uploadProfilePicture(file: File, crop: ICropMetadata): Promise<firebase.storage.UploadTaskSnapshot>;
    getProfilePicture(imagePath: string): Promise<string>;
}

export interface ICropMetadata {
    aspect: number;
    x: number;
    y: number;
    width: number;
    height: number;
    naturalHeight: number;
    naturalWidth: number;
}

export class PhotoService implements IPhotoService {
    private storageRef: firebase.storage.Reference;

    public constructor(firebaseConfig: IFirebaseConfig) {
        initializeFirebase(firebaseConfig);
        this.storageRef = firebase.storage().ref();
    }

    public getProfilePicture(imagePath: string): Promise<string> {
        return this.storageRef.child(imagePath).getDownloadURL();
    }

    public async uploadProfilePicture(file: File, crop: ICropMetadata): Promise<firebase.storage.UploadTaskSnapshot> {
        const user = await new Promise<firebase.User>(async resolve => {
            let user: firebase.User | null = null;
            while (user == null) {
                user = await this.getCurrentUser();
            }
            resolve(user);
        });
        return new Promise<firebase.storage.UploadTaskSnapshot>((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                if (fileReader.result != null && typeof fileReader.result !== "string") {
                    firebase
                        .firestore()
                        .collection("crops")
                        .doc(user.uid)
                        .set(crop)
                        .then(() => {
                            this.storageRef
                                .child("images")
                                .child(user.uid)
                                .child(uuid())
                                .put(fileReader.result as ArrayBuffer, { contentType: file.type })
                                .then(snapshot => {
                                    snapshot.ref.getDownloadURL();
                                    resolve(snapshot);
                                });
                        });
                } else {
                    reject("invalid file type");
                }
            };
            fileReader.readAsArrayBuffer(file);
        });
    }

    private getCurrentUser() {
        return new Promise<firebase.User | null>((resolve, reject) => {
            const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            }, reject);
        });
    }
}
