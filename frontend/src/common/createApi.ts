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
import { FIREBASE_CONFIG } from "./firebaseConfig";

export function createApi(): IApplicationApi {
    const fileService: IFileService = new FileService(FIREBASE_CONFIG);
    const userService: IUserService = new UserService(FIREBASE_CONFIG);
    const searchService: ISearchService = new SearchService(FIREBASE_CONFIG);
    const photoService: IPhotoService = new PhotoService(FIREBASE_CONFIG);
    return { fileService, userService, searchService, photoService };
}
