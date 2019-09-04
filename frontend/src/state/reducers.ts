import { combineReducers, reduceCompoundActions, TypedReducer } from "redoodle";
import { ClearHomeState, SetTasks, SetShowIncompletedTasks, SetCurrentTask } from "./actions";
import { IRouterState, IApplicationState, ITaskState } from "./types";
import { TypedAsyncLoadedReducer } from "../common/redoodle";
import { Reducer } from "redux";
import { ITaskWithId } from "../api";

const tasksWithIdReducer = TypedAsyncLoadedReducer.builder<ITaskWithId[], string>()
    .withAsyncLoadHandler(SetTasks, tasks => tasks, error => error)
    .build();

const showIncompletedTasksReducer = TypedReducer.builder<boolean>()
    .withHandler(SetShowIncompletedTasks.TYPE, (_state, payload) => payload)
    .build();

const currentTaskReducer = TypedAsyncLoadedReducer.builder<ITaskWithId, string>()
    .withAsyncLoadHandler(SetCurrentTask, task => task, error => error)
    .build();

const taskStateReducer = combineReducers<ITaskState>({
    tasksWithId: tasksWithIdReducer,
    showIncompletedTasks: showIncompletedTasksReducer,
    currentTask: currentTaskReducer,
});

const routeStateReducer = TypedReducer.builder<IRouterState>()
    .withHandler(ClearHomeState.TYPE, state => state)
    .build();

export const appReducer: Reducer<IApplicationState | undefined> = reduceCompoundActions(
    combineReducers<IApplicationState | undefined>({
        taskState: taskStateReducer,
        routeState: routeStateReducer,
    }),
);
