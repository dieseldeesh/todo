import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export class AddPath extends IPath {
    public static readonly TEMPLATE = `/add`;

    public static fromRoute(_routeProps: RouteComponentProps) {
        return new AddPath();
    }

    public getTemplate() {
        return AddPath.TEMPLATE;
    }

    public getPathName() {
        return AddPath.TEMPLATE;
    }

    public getTitle() {
        return `Add a task`;
    }

    public getQueryParams() {
        return {};
    }

    public getPathParams() {
        return {};
    }
}
