import firebase from "firebase/app";
import "firebase/functions";
import { IFirebaseConfig, initializeFirebase } from "../common/firebase";

export interface ISearchedUser {
    displayName: string | undefined;
    email: string;
    photoURL: string | undefined;
    id: string;
}

export interface ISearchService {
    searchUsers(query: string): Promise<Array<ISearchedUser>>;
    getUsers(userIds: string[]): Promise<Array<ISearchedUser>>;
}

export interface IAlgoliaConfiguration {
    applicationId: string;
    apiKey: string;
}

export class SearchService implements ISearchService {
    private static SEARCH_USERS_FUNCTION = "searchUsers";
    private static FETCH_USERS_FUNCTION = "fetchUsers";
    private searchUsersFunction: firebase.functions.HttpsCallable;
    private fetchUsersFunction: firebase.functions.HttpsCallable;

    public constructor(firebaseConfig: IFirebaseConfig) {
        initializeFirebase(firebaseConfig);
        this.searchUsersFunction = firebase.functions().httpsCallable(SearchService.SEARCH_USERS_FUNCTION);
        this.fetchUsersFunction = firebase.functions().httpsCallable(SearchService.FETCH_USERS_FUNCTION);
    }

    public searchUsers(query: string): Promise<Array<ISearchedUser>> {
        return this.searchUsersFunction({ query }).then(result => result.data);
    }

    public getUsers(userIds: string[]): Promise<Array<ISearchedUser>> {
        return this.fetchUsersFunction({ userIds }).then(result => result.data);
    }
}
