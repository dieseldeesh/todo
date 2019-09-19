import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export class ProfilePath extends IPath {
    public static readonly TEMPLATE = `/profile`;

    public static fromRoute(_routeProps: RouteComponentProps) {
        return new ProfilePath();
    }

    public getTemplate() {
        return ProfilePath.TEMPLATE;
    }

    public getPathName() {
        return ProfilePath.TEMPLATE;
    }

    public getTitle() {
        return `View user profile`;
    }

    public getQueryParams() {
        return {};
    }

    public getPathParams() {
        return {};
    }
}
