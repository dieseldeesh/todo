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
import { firebaseConfig } from "./firebaseConfig";

export function createApi(): IApplicationApi {
    const fileService: IFileService = new FileService(firebaseConfig);
    const userService: IUserService = new UserService(firebaseConfig);
    const searchService: ISearchService = new SearchService(firebaseConfig);
    const photoService: IPhotoService = new PhotoService(firebaseConfig);
    return { fileService, userService, searchService, photoService };
}
