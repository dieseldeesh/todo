import { IAsyncLoaded } from "../common/redoodle";
import { Map } from "immutable";
import { IFileService, IUserService, ITask, ISearchService, ISearchedUser, IProject, IPhotoService } from "../api";
import { EntityWithId } from "../common/firebase";

export interface IApplicationState {
    fileState: IFileState;
    authState: IAuthState;
    userSearchState: IUserSearchState;
}

export interface IFileState {
    tasksWithId: IAsyncLoaded<Array<EntityWithId<ITask>>, string>;
    projectsWithId: IAsyncLoaded<Array<EntityWithId<IProject>>, string>;
    showIncompletedTasks: boolean;
    currentTask: IAsyncLoaded<EntityWithId<ITask>, string>;
    currentProject: IAsyncLoaded<EntityWithId<IProject>, string>;
    taskProject: IAsyncLoaded<EntityWithId<IProject>, string>;
    fetchedProjects: Map<string, IAsyncLoaded<EntityWithId<IProject>, string>>;
    fetchedTasks: Map<string, IAsyncLoaded<EntityWithId<ITask>, string>>;
}

export interface IAuthState {
    currentUser: IAsyncLoaded<IUserInfo | null, string>;
    currentUserPhotoURL: IAsyncLoaded<string | null, string>;
}

export interface IUserSearchState {
    searchedUsers: IAsyncLoaded<ISearchedUser[], string>;
    fetchedUsers: Map<string, IAsyncLoaded<ISearchedUser, string>>;
}

export interface IUserInfo {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
    uid: string;
}

export enum AppView {
    TASKS = "tasks",
    PROJECTS = "projects",
    PROFILE = "profile",
}

export enum AppAction {
    ADD_TASK = "add_task",
    EDIT_TASK = "edit_task",
    ADD_PROJECT = "add_project",
    EDIT_PROJECT = "edit_project",
}

export enum TaskStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    BLOCKED = "blocked",
    COMPLETED = "completed",
}

export enum TaskDifficulty {
    EASY = "easy",
    MEDIUM = "medium",
    HARD = "hard",
}

export enum TaskImportance {
    P0 = "p0",
    P1 = "p1",
    P2 = "p2",
    P3 = "p3",
    P4 = "p4",
}

export interface IApplicationApi {
    fileService: IFileService;
    userService: IUserService;
    searchService: ISearchService;
    photoService: IPhotoService;
}
