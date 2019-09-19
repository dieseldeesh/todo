import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { IFirebaseConfig, initializeFirebase, Callback } from "../common/firebase";
import { NullableValue } from "../common/nullableValue";
import { noop } from "lodash-es";

export interface IUserProfile {
    displayName: string;
    email: string;
}

export interface IFullUserProfile {
    id: string;
    displayName: string;
    email: string;
    photoURL: string | null;
}

export interface IUserService {
    signUp(email: string, password: string): Promise<firebase.auth.UserCredential>;
    signIn(email: string, password: string): Promise<firebase.auth.UserCredential>;
    signOut(): Promise<void>;
    onUserUpdate(userId: string, callback: Callback<NullableValue<IFullUserProfile>>): void;
    deleteCurrentUser(): Promise<void>;
    updateCurrentUser(userProfile: IUserProfile): Promise<void>;
    onAuthStateChanged(callback: (user: NullableValue<firebase.User>) => void): void;
}

export class UserService implements IUserService {
    private static USERS_COLLECTION = "users";
    private usersCollection: firebase.firestore.CollectionReference;

    public constructor(firebaseConfig: IFirebaseConfig) {
        initializeFirebase(firebaseConfig);
        this.usersCollection = firebase.firestore().collection(UserService.USERS_COLLECTION);
    }

    public onUserUpdate(userId: string, callback: Callback<NullableValue<IFullUserProfile>>) {
        this.usersCollection.doc(userId).onSnapshot(doc => {
            callback(
                NullableValue.of(doc.data() as IFullUserProfile | undefined).map(data => ({ ...data, id: userId })),
            );
        });
    }

    public signUp(email: string, password: string): Promise<firebase.auth.UserCredential> {
        return firebase
            .auth()
            .createUserWithEmailAndPassword(email, password)
            .then(user => {
                if (user.user != null) {
                    const { uid, displayName, email, photoURL } = user.user;
                    this.usersCollection.doc(uid).set({ displayName, email, photoURL });
                }
                return user;
            });
    }

    public signIn(email: string, password: string): Promise<firebase.auth.UserCredential> {
        return firebase.auth().signInWithEmailAndPassword(email, password);
    }

    public signOut(): Promise<void> {
        return firebase.auth().signOut();
    }

    public updateCurrentUser(userProfile: IUserProfile) {
        const { currentUser } = firebase.auth();
        if (currentUser != null) {
            const { email, ...rest } = userProfile;
            return Promise.all([currentUser.updateProfile(rest), currentUser.updateEmail(email)]).then(() => {
                this.usersCollection.doc(currentUser.uid).update(userProfile);
            });
        }
        return Promise.resolve();
    }

    public deleteCurrentUser(): Promise<void> {
        const { currentUser } = firebase.auth();
        if (currentUser != null) {
            const { uid: userId } = currentUser;
            return Promise.all([this.usersCollection.doc(userId).delete(), currentUser.delete()]).then(noop);
        }
        return Promise.resolve();
    }

    public onAuthStateChanged(callback: (user: NullableValue<firebase.User>) => void): void {
        firebase.auth().onAuthStateChanged(user => callback(NullableValue.of(user)));
    }
}
