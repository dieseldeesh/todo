import { IApplicationState } from "./types";
import { AsyncLoadedValue } from "../common/redoodle";
import { History } from "history";

export const createInitialState = (history: History): IApplicationState => ({
    taskState: {
        tasksWithId: AsyncLoadedValue.asyncNotStartedLoading(),
        showIncompletedTasks: true,
        currentTask: AsyncLoadedValue.asyncNotStartedLoading(),
    },
    routeState: {
        location: history.location,
    },
});
