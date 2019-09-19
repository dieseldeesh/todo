import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";
import * as queryString from "query-string";

export interface ITaskPathQueryParams {
    taskId?: string;
}

export class TaskPath extends IPath {
    public static readonly TEMPLATE = `/tasks`;

    public static fromRoute(routeProps: RouteComponentProps) {
        return new TaskPath(TaskPath.parseQueryParams(routeProps));
    }

    private static parseQueryParams(routeProps: RouteComponentProps<{}>): ITaskPathQueryParams {
        const { taskId } = queryString.parse(routeProps.location.search);
        return { taskId: taskId == null ? undefined : (taskId as string) };
    }

    constructor(private queryParams: ITaskPathQueryParams) {
        super();
    }

    public getTemplate() {
        return TaskPath.TEMPLATE;
    }

    public getPathName() {
        return TaskPath.TEMPLATE;
    }

    public getTitle() {
        return `List all tasks`;
    }

    public getQueryParams() {
        return this.queryParams;
    }

    public getPathParams() {
        return {};
    }
}
