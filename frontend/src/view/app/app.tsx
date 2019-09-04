import React from "react";
import { RouteComponentProps, withRouter, Switch, Route } from "react-router";
import { PathRedirect } from "../../common/navigationWithPath";
import { Home } from "../home/home";
import { NotFound } from "../notFound/notFound";
import { Classes } from "@blueprintjs/core";
import { AddPath, ListPath, EditPath } from "../../paths";
import { AppAction } from "../../state/types";

class ConnectedApp extends React.PureComponent<RouteComponentProps<any>> {
    public render() {
        return (
            <div className={Classes.DARK}>
                <Switch>
                    <Route exact={true} path="/" render={this.renderRootRedirect} />
                    <Route path={ListPath.TEMPLATE} render={this.renderList} />
                    <Route path={AddPath.TEMPLATE} render={this.renderAdd} />
                    <Route path={EditPath.TEMPLATE} render={this.renderEdit} />
                    <Route render={this.renderDefault} />
                </Switch>
            </div>
        );
    }

    private renderRootRedirect = () => <PathRedirect to={new ListPath()} />;

    private renderAdd = (routeProps: RouteComponentProps) => {
        return <Home history={routeProps.history} action={AppAction.ADD_TASK} taskId={undefined} />;
    };

    private renderEdit = (routeProps: RouteComponentProps) => {
        const { taskId } = EditPath.fromRoute(routeProps).getQueryParams();
        return <Home history={routeProps.history} action={AppAction.EDIT_TASK} taskId={taskId} />;
    };

    private renderList = (routeProps: RouteComponentProps) => {
        return <Home history={routeProps.history} action={AppAction.LIST_TASKS} taskId={undefined} />;
    };

    private renderDefault = () => <NotFound />;
}

export const App = withRouter(ConnectedApp);
