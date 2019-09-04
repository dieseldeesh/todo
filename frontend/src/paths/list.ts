import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export class ListPath extends IPath {
    public static readonly TEMPLATE = `/tasks`;

    public static fromRoute(_routeProps: RouteComponentProps) {
        return new ListPath();
    }

    public getTemplate() {
        return ListPath.TEMPLATE;
    }

    public getPathName() {
        return ListPath.TEMPLATE;
    }

    public getTitle() {
        return `List all tasks`;
    }

    public getQueryParams() {
        return {};
    }

    public getPathParams() {
        return {};
    }
}
