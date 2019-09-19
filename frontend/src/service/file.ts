import { Store } from "redux";
import {
    IApplicationState,
    SetTasks,
    SetCurrentTask,
    SetProjects,
    SetCurrentProject,
    AddFetchedProjects,
    SetCurrentUserPhotoUrl,
} from "../state";
import { ITask, IFileService, IProject, IPhotoService, ICropMetadata } from "../api";
import { noop } from "lodash-es";
import { Cancelable, EntityWithId } from "../common/firebase";
import { CompoundAction } from "redoodle";
import { Map } from "immutable";
import { IAsyncLoaded, AsyncLoadedValue } from "../common/redoodle";

export class FileService {
    private cancelTaskSubscription: Cancelable;
    private cancelProjectSubscription: Cancelable;
    private cancelCurrentTaskSubscription: Cancelable;
    private cancelCurrentProjectSubscription: Cancelable;
    private cancelFetchProjectSubscription: Cancelable;

    constructor(
        private store: Store<IApplicationState>,
        private fileService: IFileService,
        private photoService: IPhotoService,
    ) {
        this.cancelTaskSubscription = noop;
        this.cancelProjectSubscription = noop;
        this.cancelCurrentTaskSubscription = noop;
        this.cancelCurrentProjectSubscription = noop;
        this.cancelFetchProjectSubscription = noop;
    }

    public deleteTask(taskId: string) {
        return this.fileService.deleteTask(taskId);
    }

    public saveTask(task: ITask, taskId?: string) {
        if (taskId == null) {
            return this.fileService.createTask(task);
        } else {
            return this.fileService.editTask(taskId, task).then(() => taskId);
        }
    }

    public getTask(taskId: string) {
        this.cancelCurrentTaskSubscription();
        this.cancelCurrentTaskSubscription = this.fileService.getTask(taskId, nullableTask => {
            const task = nullableTask.getOrUndefined();
            if (task != null) {
                this.store.dispatch(SetCurrentTask.Success.create(task));
            }
        });
    }

    public listCompletedTasks() {
        this.clearSubscriptionsAndProjectState();
        this.store.dispatch(SetTasks.InProgress.create(undefined));
        this.fileService
            .listCompletedTasksForCurrentUser(x => {
                this.store.dispatch(SetTasks.Success.create(x));
            })
            .then(cancellable => {
                this.cancelTaskSubscription = cancellable;
            });
    }

    public listIncompleteTasks() {
        this.clearSubscriptionsAndProjectState();
        this.store.dispatch(SetTasks.InProgress.create(undefined));
        this.fileService
            .listIncompleteTasksForCurrentUser(x => {
                this.store.dispatch(SetTasks.Success.create(x));
            })
            .then(cancellable => {
                this.cancelTaskSubscription = cancellable;
            });
    }

    public listCompletedTasksForProject(projectId: string) {
        this.cancelTaskSubscription();
        this.store.dispatch(SetTasks.InProgress.create(undefined));
        this.cancelTaskSubscription = this.fileService.listCompletedTasksForProject(projectId, tasks => {
            this.store.dispatch(SetTasks.Success.create(tasks));
        });
    }

    public listIncompleteTasksForProject(projectId: string) {
        console.log("listIncompleteTasksForProject", projectId);
        this.cancelTaskSubscription();
        this.store.dispatch(SetTasks.InProgress.create(undefined));
        this.cancelTaskSubscription = this.fileService.listIncompleteTasksForProject(projectId, tasks => {
            console.log("swag", projectId, tasks);
            this.store.dispatch(SetTasks.Success.create(tasks));
        });
    }

    public saveProject(project: IProject, projectId?: string): Promise<string> {
        if (projectId == null) {
            return this.fileService.createProject(project);
        } else {
            return this.fileService.editProject(projectId, project).then(() => projectId);
        }
    }

    public getProject(projectId: string | null) {
        this.cancelProjectSubscription();
        this.cancelCurrentProjectSubscription();
        this.store.dispatch(SetProjects.InProgress.create(undefined));
        if (projectId != null) {
            this.cancelCurrentProjectSubscription = this.fileService.getProject(projectId, nullableProject => {
                const project = nullableProject.getOrUndefined();
                if (project != null) {
                    if (project.parentProjectId) {
                        this.fetchProject(project.parentProjectId);
                    }
                    this.store.dispatch(SetCurrentProject.Success.create(project));
                }
            });
        } else {
            this.store.dispatch(
                CompoundAction.create([SetTasks.Success.create([]), SetCurrentProject.Clear.create(undefined)]),
            );
        }
        this.fileService
            .getProjects(projectId, projects => {
                this.store.dispatch(SetProjects.Success.create(projects));
            })
            .then(cancellable => {
                this.cancelProjectSubscription = cancellable;
            });
    }

    public deleteProject(projectId: string): Promise<void> {
        return this.fileService.deleteProject(projectId);
    }

    public fetchProject(projectId: string) {
        this.cancelFetchProjectSubscription();
        this.cancelFetchProjectSubscription = this.fileService.getProject(projectId, nullableProject => {
            const project = nullableProject.getOrUndefined();
            if (project != null) {
                const projectArray: Array<[string, IAsyncLoaded<EntityWithId<IProject>, string>]> = [
                    [project.id, AsyncLoadedValue.asyncLoadingSucceeded(project)],
                ];
                this.store.dispatch(AddFetchedProjects.create(Map(projectArray)));
            }
        });
    }

    public clearTask() {
        this.cancelCurrentTaskSubscription();
        this.store.dispatch(SetCurrentTask.Clear.create(undefined));
    }

    public clearTasks() {
        this.cancelTaskSubscription();
        this.store.dispatch(SetTasks.Clear.create(undefined));
    }

    public uploadPhoto(file: File, crop: ICropMetadata) {
        return this.photoService.uploadProfilePicture(file, crop);
    }

    public getProfilePicture(photoURL: string) {
        this.photoService.getProfilePicture(photoURL).then(url => {
            this.store.dispatch(SetCurrentUserPhotoUrl.Success.create(url));
        });
    }

    private clearSubscriptionsAndProjectState = () => {
        this.cancelTaskSubscription();
        this.cancelCurrentProjectSubscription();
        this.cancelProjectSubscription();
        this.cancelFetchProjectSubscription();
        this.store.dispatch(
            CompoundAction.create([SetProjects.Clear.create(undefined), SetCurrentProject.Clear.create(undefined)]),
        );
    };
}
