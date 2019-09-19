import React from "react";
import { Route, Redirect, RouteProps, RouteComponentProps } from "react-router";
import { SignInPath } from "../paths";
import { IUserInfo } from "../state";

interface IAuthRouteProps extends Omit<RouteProps, "render"> {
    currentUser: IUserInfo | null;
    currentUserPhotoURL: string | null;
    render: (
        currentUser: IUserInfo,
        currentUserPhotoURL: string | null,
    ) => (props: RouteComponentProps<any>) => React.ReactNode;
}

export class AuthRoute extends React.PureComponent<IAuthRouteProps> {
    public render() {
        const { render, currentUser, currentUserPhotoURL, ...rest } = this.props;
        return (
            <Route
                {...rest}
                render={currentUser != null ? render(currentUser, currentUserPhotoURL) : this.renderRedirect}
            />
        );
    }

    private renderRedirect(props: RouteComponentProps<any>) {
        return <Redirect to={{ pathname: SignInPath.TEMPLATE, state: { from: props.location } }} />;
    }
}
