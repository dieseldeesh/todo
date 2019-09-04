import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";
import * as queryString from "query-string";

export interface IEditPathQueryParams {
    taskId: string;
}

export class EditPath extends IPath<{}, IEditPathQueryParams> {
    public static readonly TEMPLATE = `/edit`;

    public static fromRoute(routeProps: RouteComponentProps) {
        return new EditPath(EditPath.parseQueryParams(routeProps));
    }

    private static parseQueryParams(routeProps: RouteComponentProps<{}>): IEditPathQueryParams {
        const queryParams = queryString.parse(routeProps.location.search);
        return { taskId: queryParams.taskId as string };
    }

    constructor(private queryParams: IEditPathQueryParams) {
        super();
    }

    public getTemplate() {
        return EditPath.TEMPLATE;
    }

    public getPathName() {
        return EditPath.TEMPLATE;
    }

    public getTitle() {
        return `Edit a task`;
    }

    public getQueryParams() {
        return this.queryParams;
    }

    public getPathParams() {
        return {};
    }
}
