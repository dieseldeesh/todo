import { IApplicationState } from "./types";
import { AsyncLoadedValue, IAsyncLoaded } from "../common/redoodle";
import { Map } from "immutable";
import { ISearchedUser } from "../api";
import { EntityWithId } from "../common/firebase";
import { IProject, ITask } from "../api/file";

export const createInitialState = (): IApplicationState => ({
    fileState: {
        tasksWithId: AsyncLoadedValue.asyncNotStartedLoading(),
        projectsWithId: AsyncLoadedValue.asyncNotStartedLoading(),
        showIncompletedTasks: true,
        currentTask: AsyncLoadedValue.asyncNotStartedLoading(),
        currentProject: AsyncLoadedValue.asyncNotStartedLoading(),
        taskProject: AsyncLoadedValue.asyncNotStartedLoading(),
        fetchedProjects: Map<string, IAsyncLoaded<EntityWithId<IProject>, string>>(),
        fetchedTasks: Map<string, IAsyncLoaded<EntityWithId<ITask>, string>>(),
    },
    authState: {
        currentUser: AsyncLoadedValue.asyncNotStartedLoading(),
        currentUserPhotoURL: AsyncLoadedValue.asyncNotStartedLoading(),
    },
    userSearchState: {
        searchedUsers: AsyncLoadedValue.asyncNotStartedLoading(),
        fetchedUsers: Map<string, IAsyncLoaded<ISearchedUser, string>>(),
    },
});
