import React from "react";
import { RouteComponentProps, withRouter, Switch, Route } from "react-router";
import { PathRedirect } from "../../common/navigationWithPath";
import { Home } from "../home/home";
import { NotFound } from "../notFound/notFound";
import { Classes, Spinner } from "@blueprintjs/core";
import { TaskPath, SignInPath, ProjectPath, ProfilePath } from "../../paths";
import { IApplicationState, IAuthState, IUserInfo, AppView } from "../../state";
import { Auth } from "../auth/auth";
import { AuthRoute } from "../../common/authRoute";
import { connect } from "react-redux";
import { AsyncLoadedValue } from "../../common/redoodle";
import { Profile } from "../profile/profile";
import { ContextType, getServices } from "../../common/contextProvider";

type Props = RouteComponentProps<any> & IAuthState;

class ConnectedApp extends React.PureComponent<Props> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);
    private static STRINGS = {
        TASKS: "Tasks",
        PROJECTS: "Projects",
        PROFILE: "Profile",
        WELCOME: "Welcome to Todolooo",
        NOT_FOUND: "Not found",
    };

    public render() {
        const { currentUser, currentUserPhotoURL } = this.props;
        if (
            !AsyncLoadedValue.isLoadingSucceeded(currentUser) ||
            !AsyncLoadedValue.isLoadingSucceeded(currentUserPhotoURL)
        ) {
            return <Spinner />;
        }
        return this.renderLoaded(currentUser.value, currentUserPhotoURL.value);
    }

    private renderLoaded(currentUser: IUserInfo | null, currentUserPhotoURL: string | null) {
        const loggedIn = currentUser != null;
        return (
            <div className={Classes.DARK}>
                <Switch>
                    <Route path={SignInPath.TEMPLATE} render={this.renderSignIn(loggedIn)} />
                    <AuthRoute
                        currentUser={currentUser}
                        currentUserPhotoURL={currentUserPhotoURL}
                        exact={true}
                        path="/"
                        render={this.renderRootRedirect}
                    />
                    <AuthRoute
                        currentUser={currentUser}
                        currentUserPhotoURL={currentUserPhotoURL}
                        path={TaskPath.TEMPLATE}
                        render={this.renderTasks}
                    />
                    <AuthRoute
                        currentUser={currentUser}
                        currentUserPhotoURL={currentUserPhotoURL}
                        path={ProjectPath.TEMPLATE}
                        render={this.renderProjects}
                    />
                    <AuthRoute
                        currentUser={currentUser}
                        currentUserPhotoURL={currentUserPhotoURL}
                        path={ProfilePath.TEMPLATE}
                        render={this.renderProfile}
                    />
                    <Route render={this.renderDefault} />
                </Switch>
            </div>
        );
    }

    private renderRootRedirect = () => () => <PathRedirect to={new TaskPath({})} />;

    private renderTasks = (currentUser: IUserInfo, currentUserPhotoURL: string | null) => (
        routeProps: RouteComponentProps,
    ) => {
        const { taskId } = TaskPath.fromRoute(routeProps).getQueryParams();
        this.services.stateService.setDocumentTitle(ConnectedApp.STRINGS.TASKS);
        return (
            <Home
                appView={AppView.TASKS}
                history={routeProps.history}
                currentUser={currentUser}
                taskId={taskId}
                currentUserPhotoURL={currentUserPhotoURL}
            />
        );
    };

    private renderProjects = (currentUser: IUserInfo, currentUserPhotoURL: string | null) => (
        routeProps: RouteComponentProps,
    ) => {
        const { taskId, projectId } = ProjectPath.fromRoute(routeProps).getQueryParams();
        this.services.stateService.setDocumentTitle(ConnectedApp.STRINGS.PROJECTS);
        return (
            <Home
                appView={AppView.PROJECTS}
                history={routeProps.history}
                currentUser={currentUser}
                projectId={projectId}
                taskId={taskId}
                currentUserPhotoURL={currentUserPhotoURL}
            />
        );
    };

    private renderSignIn = (loggedIn: boolean) => (routeProps: RouteComponentProps) => {
        this.services.stateService.setDocumentTitle(ConnectedApp.STRINGS.WELCOME);
        return <Auth loggedIn={loggedIn} history={routeProps.history} />;
    };

    private renderProfile = (currentUser: IUserInfo, currentUserPhotoURL: string | null) => (
        routeProps: RouteComponentProps,
    ) => {
        this.services.stateService.setDocumentTitle(ConnectedApp.STRINGS.PROFILE);
        return (
            <Profile history={routeProps.history} currentUser={currentUser} currentUserPhotoURL={currentUserPhotoURL} />
        );
    };

    private renderDefault = () => {
        this.services.stateService.setDocumentTitle(ConnectedApp.STRINGS.NOT_FOUND);
        return <NotFound />;
    };
}

const mapStateToProps = (appState: IApplicationState): IAuthState => ({ ...appState.authState });

export const App = connect(mapStateToProps)(withRouter(ConnectedApp));
