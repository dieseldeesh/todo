import { combineReducers, reduceCompoundActions, TypedReducer } from "redoodle";
import {
    SetTasks,
    SetShowIncompletedTasks,
    SetCurrentTask,
    SetCurrentUser,
    SetSearchedUsers,
    SetCurrentProject,
    AddFetchedProjects,
} from "./actions";
import { IApplicationState, IFileState, IAuthState, IUserInfo, IUserSearchState } from "./types";
import { TypedAsyncLoadedReducer, IAsyncLoaded } from "../common/redoodle";
import { Reducer } from "redux";
import { Map } from "immutable";
import { EntityWithId } from "../common/firebase";
import { ITask, ISearchedUser, IProject } from "../api";
import { AddFetchedUsers, SetProjects, AddFetchedTasks, SetCurrentUserPhotoUrl, SetTaskProject } from "./actions";

const tasksWithIdReducer = TypedAsyncLoadedReducer.builder<Array<EntityWithId<ITask>>, string>()
    .withAsyncLoadHandler(SetTasks, tasks => tasks, error => error)
    .build();

const projectsWithIdReducer = TypedAsyncLoadedReducer.builder<Array<EntityWithId<IProject>>, string>()
    .withAsyncLoadHandler(SetProjects, projects => projects, error => error)
    .build();

const showIncompletedTasksReducer = TypedReducer.builder<boolean>()
    .withHandler(SetShowIncompletedTasks.TYPE, (_state, payload) => payload)
    .build();

const currentTaskReducer = TypedAsyncLoadedReducer.builder<EntityWithId<ITask>, string>()
    .withAsyncLoadHandler(SetCurrentTask, task => task, error => error)
    .build();

const currentProjectReducer = TypedAsyncLoadedReducer.builder<EntityWithId<IProject>, string>()
    .withAsyncLoadHandler(SetCurrentProject, project => project, error => error)
    .build();

const taskProjectReducer = TypedAsyncLoadedReducer.builder<EntityWithId<IProject>, string>()
    .withAsyncLoadHandler(SetTaskProject, project => project, error => error)
    .build();

const fetchedProjectsReducer = TypedReducer.builder<Map<string, IAsyncLoaded<EntityWithId<IProject>, string>>>()
    .withHandler(AddFetchedProjects.TYPE, (state, projects) => state.merge(projects))
    .build();

const fetchedTasksReducer = TypedReducer.builder<Map<string, IAsyncLoaded<EntityWithId<ITask>, string>>>()
    .withHandler(AddFetchedTasks.TYPE, (state, tasks) => state.merge(tasks))
    .build();

const taskStateReducer = combineReducers<IFileState>({
    tasksWithId: tasksWithIdReducer,
    projectsWithId: projectsWithIdReducer,
    showIncompletedTasks: showIncompletedTasksReducer,
    currentTask: currentTaskReducer,
    currentProject: currentProjectReducer,
    taskProject: taskProjectReducer,
    fetchedProjects: fetchedProjectsReducer,
    fetchedTasks: fetchedTasksReducer,
});

const currentUserReducer = TypedAsyncLoadedReducer.builder<IUserInfo | null, string>()
    .withAsyncLoadHandler(SetCurrentUser, user => user, error => error)
    .build();

const currentUserPhotoURLReducer = TypedAsyncLoadedReducer.builder<string | null, string>()
    .withAsyncLoadHandler(SetCurrentUserPhotoUrl, url => url, error => error)
    .build();

const authStateReducer = combineReducers<IAuthState>({
    currentUser: currentUserReducer,
    currentUserPhotoURL: currentUserPhotoURLReducer,
});

const searchedUsersReducer = TypedAsyncLoadedReducer.builder<ISearchedUser[], string>()
    .withAsyncLoadHandler(SetSearchedUsers, users => users, error => error)
    .build();

const fetchedUsersReducer = TypedReducer.builder<Map<string, IAsyncLoaded<ISearchedUser, string>>>()
    .withHandler(AddFetchedUsers.TYPE, (state, users) => state.merge(users))
    .build();

const userSearchStateReducer = combineReducers<IUserSearchState>({
    searchedUsers: searchedUsersReducer,
    fetchedUsers: fetchedUsersReducer,
});

export const appReducer: Reducer<IApplicationState | undefined> = reduceCompoundActions(
    combineReducers<IApplicationState | undefined>({
        fileState: taskStateReducer,
        authState: authStateReducer,
        userSearchState: userSearchStateReducer,
    }),
);
