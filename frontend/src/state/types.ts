import { IAsyncLoaded } from "../common/redoodle";
import { Location } from "history";
import { ITaskService, ITaskWithId } from "../api";

export interface IApplicationState {
    taskState: ITaskState;
    routeState: IRouterState;
}

export interface ITaskState {
    tasksWithId: IAsyncLoaded<ITaskWithId[], string>;
    showIncompletedTasks: boolean;
    currentTask: IAsyncLoaded<ITaskWithId, string>;
}

export enum AppAction {
    LIST_TASKS = "list_tasks",
    ADD_TASK = "add_task",
    EDIT_TASK = "edit_task",
}

export enum TaskStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    BLOCKED = "blocked",
    COMPLETED = "completed",
}

export interface IRouterState {
    location: Location;
}

export interface IEndpoints {
    backendApi: string | undefined;
}

export interface IApplicationApi {
    taskService: ITaskService;
}

export interface IPlayerMetadata {
    playerId: string;
    playerName: string;
}
