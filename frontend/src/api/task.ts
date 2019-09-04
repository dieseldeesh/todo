import { IHttpApiBridge, MediaType, IHttpEndpointOptions } from "conjure-client";
import { TaskStatus } from "../state";
import { sortBy } from "lodash-es";

interface ICommonTask {
    title: string;
    author: string;
    dueDate: Date;
    description: string;
}

export interface ITask extends ICommonTask {
    status: TaskStatus;
}

export interface IEncodedTask extends ICommonTask {
    status: number;
}

export interface ITaskWithId extends ITask {
    id: string;
}

export interface IEncodedTaskWithId extends IEncodedTask {
    id: string;
}

export interface ICreateTaskResponse extends ITaskWithId {}

export interface IEditTaskResponse {}

export interface IDeleteTaskResponse {}

export interface IGetTaskResponse extends ITaskWithId {}

export interface IEncodedGetTaskResponse extends IEncodedTaskWithId {}

export interface IListTasksResponse {
    items: ITaskWithId[];
    nextPageToken: string | false;
}

export interface IEncodedListTasksResponse {
    items: IEncodedTaskWithId[];
    nextPageToken: string | false;
}

export interface ITaskService {
    createTask(task: ITask): Promise<ICreateTaskResponse>;
    editTask(taskId: string, task: ITask): Promise<IEditTaskResponse>;
    deleteTask(taskId: string): Promise<IDeleteTaskResponse>;
    getTask(taskId: string): Promise<IGetTaskResponse>;
    listIncompleteTasks(pageToken?: string): Promise<IListTasksResponse>;
    listCompletedTasks(pageToken?: string): Promise<IListTasksResponse>;
}

export class TaskService implements ITaskService {
    private static BASE_HTTP_ENDPOINT_OPTIONS: IHttpEndpointOptions = {
        endpointPath: "base-path",
        headers: {},
        method: "POST",
        pathArguments: [],
        queryArguments: {},
        requestMediaType: MediaType.APPLICATION_JSON,
        responseMediaType: MediaType.APPLICATION_JSON,
    };

    private static TASK_STATUS_VALUES: Record<TaskStatus, number> = {
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.BLOCKED]: 1,
        [TaskStatus.IN_PROGRESS]: 2,
        [TaskStatus.NOT_STARTED]: 3,
    };

    private static ORDERED_TASK_STATUSES = sortBy(
        Object.keys(TaskService.TASK_STATUS_VALUES) as TaskStatus[],
        status => TaskService.TASK_STATUS_VALUES[status],
    );

    constructor(private bridge: IHttpApiBridge) {}

    public createTask(task: ITask): Promise<ICreateTaskResponse> {
        return this.bridge.callEndpoint<ICreateTaskResponse>({
            ...TaskService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: this.encodeTask(task),
            endpointName: "createTask",
            endpointPath: "/api/tasks/add",
        });
    }

    public editTask(taskId: string, task: ITask): Promise<IEditTaskResponse> {
        return this.bridge.callEndpoint<IEditTaskResponse>({
            ...TaskService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: this.encodeTask(task),
            endpointName: "editTask",
            endpointPath: "/api/tasks/edit/{taskId}",
            pathArguments: [taskId],
        });
    }

    public getTask(taskId: string): Promise<IGetTaskResponse> {
        return this.bridge
            .callEndpoint<IEncodedGetTaskResponse>({
                ...TaskService.BASE_HTTP_ENDPOINT_OPTIONS,
                data: undefined,
                method: "GET",
                endpointName: "editTask",
                endpointPath: "/api/tasks/{taskId}",
                pathArguments: [taskId],
            })
            .then(this.decodeTask);
    }

    public deleteTask(taskId: string): Promise<IDeleteTaskResponse> {
        return this.bridge.callEndpoint<IDeleteTaskResponse>({
            ...TaskService.BASE_HTTP_ENDPOINT_OPTIONS,
            data: undefined,
            endpointName: "deleteTask",
            endpointPath: "/api/tasks/delete/{taskId}",
            pathArguments: [taskId],
        });
    }

    public listIncompleteTasks(pageToken?: string): Promise<IListTasksResponse> {
        return this.bridge
            .callEndpoint<IEncodedListTasksResponse>({
                ...TaskService.BASE_HTTP_ENDPOINT_OPTIONS,
                data: undefined,
                method: "GET",
                endpointName: "listIncompleteTasks",
                endpointPath: "/api/tasks/incomplete",
                queryArguments: {
                    pageToken,
                },
            })
            .then(({ items, nextPageToken }) => ({
                items: items.map(this.decodeTask),
                nextPageToken,
            }));
    }

    public listCompletedTasks(pageToken?: string): Promise<IListTasksResponse> {
        return this.bridge
            .callEndpoint<IEncodedListTasksResponse>({
                ...TaskService.BASE_HTTP_ENDPOINT_OPTIONS,
                data: undefined,
                method: "GET",
                endpointName: "listCompletedTasks",
                endpointPath: "/api/tasks/completed",
                queryArguments: {
                    pageToken,
                },
            })
            .then(({ items, nextPageToken }) => ({
                items: items.map(this.decodeTask),
                nextPageToken,
            }));
    }

    private encodeTask(task: ITask): IEncodedTask {
        return { ...task, status: TaskService.TASK_STATUS_VALUES[task.status] };
    }

    private decodeTask(task: IEncodedTaskWithId): ITaskWithId {
        return { ...task, status: TaskService.ORDERED_TASK_STATUSES[task.status] };
    }
}
