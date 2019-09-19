import { IApplicationApi } from "../state";
import {
    IFileService,
    FileService,
    IUserService,
    UserService,
    ISearchService,
    SearchService,
    IPhotoService,
    PhotoService,
} from "../api";
import { IFirebaseConfig } from "./firebase";

export function createApi(): IApplicationApi {
    const firebaseConfig: IFirebaseConfig = {
        apiKey: "AIzaSyBMzJrWiXGNCne6zknCHiEK0lFahFH3i4s",
        authDomain: "adhishr-test.firebaseapp.com",
        databaseURL: "https://adhishr-test.firebaseio.com",
        projectId: "adhishr-test",
        storageBucket: "adhishr-test.appspot.com",
        messagingSenderId: "388413511255",
        appId: "1:388413511255:web:e1db4819bd32e37b75b512",
    };
    const fileService: IFileService = new FileService(firebaseConfig);
    const userService: IUserService = new UserService(firebaseConfig);
    const searchService: ISearchService = new SearchService(firebaseConfig);
    const photoService: IPhotoService = new PhotoService(firebaseConfig);
    return { fileService, userService, searchService, photoService };
}
