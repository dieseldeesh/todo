import { Store } from "redux";
import { IApplicationState, SetTasks, SetCurrentTask } from "../state";
import { ITask, ITaskService } from "../api";
import { ITaskWithId } from "../api/task";

export class TaskService {
    constructor(private store: Store<IApplicationState>, private taskService: ITaskService) {}

    public deleteTask(taskId: string) {
        return this.taskService.deleteTask(taskId).then(() => {
            this.refreshTasks();
        });
    }

    public saveTask(task: ITask, taskId?: string) {
        if (taskId == null) {
            return this.taskService.createTask(task).then(taskWithId => {
                this.refreshTasks();
                return taskWithId.id;
            });
        } else {
            return this.taskService.editTask(taskId, task).then(() => {
                this.refreshTasks();
                return taskId;
            });
        }
    }

    public getTask(taskId: string) {
        return this.taskService.getTask(taskId).then(task => {
            this.store.dispatch(SetCurrentTask.Success.create(task));
        });
    }

    public listCompletedTasks() {
        new Promise<ITaskWithId[]>((resolve, reject) => {
            this.listTasksRecursive(true, resolve, reject);
        }).then(tasksWithId => {
            const tasks = tasksWithId.map(task => ({ ...task, dueDate: new Date(task.dueDate) }));
            this.store.dispatch(SetTasks.Success.create(tasks));
        });
    }

    public listIncompleteTasks() {
        new Promise<ITaskWithId[]>((resolve, reject) => {
            this.listTasksRecursive(false, resolve, reject);
        }).then(tasksWithId => {
            const tasks = tasksWithId.map(task => ({ ...task, dueDate: new Date(task.dueDate) }));
            this.store.dispatch(SetTasks.Success.create(tasks));
        });
    }

    private listTasksRecursive(
        showCompleted: boolean,
        resolve: (value: ITaskWithId[]) => void,
        reject: (reason: any) => void,
        pageToken: string | undefined = undefined,
        prevTaskIds: ITaskWithId[] = [],
    ) {
        const promise = showCompleted
            ? this.taskService.listCompletedTasks(pageToken)
            : this.taskService.listIncompleteTasks(pageToken);
        return promise
            .then(({ items, nextPageToken }) => {
                const taskIds = [...prevTaskIds, ...items];
                if (nextPageToken === false) {
                    resolve(taskIds);
                } else {
                    this.listTasksRecursive(showCompleted, resolve, reject, nextPageToken, taskIds);
                }
            })
            .catch(error => reject(error));
    }

    private refreshTasks() {
        this.store.getState().taskState.showIncompletedTasks ? this.listIncompleteTasks() : this.listCompletedTasks();
    }
}
