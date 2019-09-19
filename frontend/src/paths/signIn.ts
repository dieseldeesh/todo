import { RouteComponentProps } from "react-router";
import { IPath } from "../common/path";

export class SignInPath extends IPath {
    public static readonly TEMPLATE = `/signin`;

    public static fromRoute(_routeProps: RouteComponentProps) {
        return new SignInPath();
    }

    public getTemplate() {
        return SignInPath.TEMPLATE;
    }

    public getPathName() {
        return SignInPath.TEMPLATE;
    }

    public getTitle() {
        return `Sign in`;
    }

    public getQueryParams() {
        return {};
    }

    public getPathParams() {
        return {};
    }
}
