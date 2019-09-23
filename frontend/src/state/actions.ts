import { TypedAction } from "redoodle";
import { TypedAsyncAction, IAsyncLoaded } from "../common/redoodle";
import { ITask, ISearchedUser, IProject } from "../api";
import { AppAction, IUserInfo } from "./types";
import { Map } from "immutable";
import { EntityWithId } from "../common/firebase";

export const SetTasks = TypedAsyncAction.define("SET_TASKS")<undefined, Array<EntityWithId<ITask>>, string>();
export const SetProjects = TypedAsyncAction.define("SET_PROJECTS")<undefined, Array<EntityWithId<IProject>>, string>();
export const SetCurrentTask = TypedAsyncAction.define("SET_CURRENT_TASK")<undefined, EntityWithId<ITask>, string>();
export const SetCurrentUserPhotoUrl = TypedAsyncAction.define("SET_CURRENT_USER_PHOTO_URL")<
    undefined,
    string | null,
    string
>();
export const SetCurrentProject = TypedAsyncAction.define("SET_CURRENT_PROJECT")<
    undefined,
    EntityWithId<IProject>,
    string
>();
export const SetTaskProject = TypedAsyncAction.define("SET_TASK_PROJECT")<undefined, EntityWithId<IProject>, string>();
export const SetShowIncompletedTasks = TypedAction.define("SET_SHOW_INCOMPLETED_TASKS")<boolean>();
export const SetCurrentUser = TypedAsyncAction.define("SET_CURRENT_USER")<undefined, IUserInfo | null, string>();
export const SetSearchedUsers = TypedAsyncAction.define("SET_SEARCHED_USERS")<undefined, ISearchedUser[], string>();
export const AddFetchedUsers = TypedAction.define("ADD_FETCHED_USERS")<
    Map<string, IAsyncLoaded<ISearchedUser, string>>
>();
export const AddFetchedProjects = TypedAction.define("ADD_FETCHED_PROJECTS")<
    Map<string, IAsyncLoaded<EntityWithId<IProject>, string>>
>();
export const AddFetchedTasks = TypedAction.define("ADD_FETCHED_TASKS")<
    Map<string, IAsyncLoaded<EntityWithId<ITask>, string>>
>();
export const SetAppAction = TypedAction.define("SET_APP_ACTION")<AppAction>();
export const CreateToast = TypedAsyncAction.define("CREATE_TOAST")<string, string, string>();
export const SetTitle = TypedAction.define("SET_TITLE")<string>();
