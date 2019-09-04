import { TypedAction } from "redoodle";
import { TypedAsyncAction } from "../common/redoodle";
import { ITaskWithId } from "../api";
import { AppAction } from "./types";

export const SetTasks = TypedAsyncAction.define("SET_TASKS")<undefined, ITaskWithId[], string>();
export const SetCurrentTask = TypedAsyncAction.define("SET_CURRENT_TASK")<undefined, ITaskWithId, string>();
export const SetShowIncompletedTasks = TypedAction.define("SET_SHOW_INCOMPLETED_TASKS")<boolean>();
export const ClearHomeState = TypedAction.define("CLEAR_HOME_STATE")<undefined>();
export const SetAppAction = TypedAction.define("SET_APP_ACTION")<AppAction>();
export const CreateToast = TypedAsyncAction.define("CREATE_TOAST")<string, string, string>();
export const SetTitle = TypedAction.define("SET_TITLE")<string>();
