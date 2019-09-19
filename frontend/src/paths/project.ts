import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";
import * as queryString from "query-string";

export interface IProjectPathQueryParams {
    taskId?: string;
    projectId?: string;
}

export class ProjectPath extends IPath {
    public static readonly TEMPLATE = `/projects`;

    public static fromRoute(routeProps: RouteComponentProps) {
        return new ProjectPath(ProjectPath.parseQueryParams(routeProps));
    }

    private static parseQueryParams(routeProps: RouteComponentProps<{}>): IProjectPathQueryParams {
        const { taskId, projectId } = queryString.parse(routeProps.location.search);
        return {
            taskId: taskId == null ? undefined : (taskId as string),
            projectId: projectId == null ? undefined : (projectId as string),
        };
    }

    constructor(private queryParams: IProjectPathQueryParams) {
        super();
    }

    public getTemplate() {
        return ProjectPath.TEMPLATE;
    }

    public getPathName() {
        return ProjectPath.TEMPLATE;
    }

    public getTitle() {
        return `List all projects`;
    }

    public getQueryParams() {
        return this.queryParams;
    }

    public getPathParams() {
        return {};
    }
}
