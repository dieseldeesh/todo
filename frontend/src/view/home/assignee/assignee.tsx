import React from "react";
import { ContextType, getServices } from "../../../common/contextProvider";
import { IUserSearchState, IApplicationState } from "../../../state";
import { AsyncLoaded } from "../../../common/asyncLoaded";
import { ISearchedUser } from "../../../api";
import { connect } from "react-redux";

interface IOwnProps {
    assignee: string;
    render: (assignee: ISearchedUser) => React.ReactNode;
}

type IProps = IOwnProps & IUserSearchState;

class UnconnectedAssignee extends React.PureComponent<IProps> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);

    public componentDidMount() {
        const { assignee, fetchedUsers } = this.props;
        const user = fetchedUsers.get(assignee);
        if (user == null) {
            this.services.userService.fetchUsers([this.props.assignee]);
        }
    }

    public componentDidUpdate(prevProps: IProps) {
        const { assignee } = this.props;
        if (assignee !== prevProps.assignee) {
            this.services.userService.fetchUsers([assignee]);
        }
    }

    public render() {
        const { fetchedUsers, assignee } = this.props;
        const user = fetchedUsers.get(assignee);
        if (user == null) {
            return null;
        }
        return <AsyncLoaded asyncLoadedValue={user} renderLoaded={this.renderLoaded} />;
    }

    private renderLoaded = (user: ISearchedUser) => {
        return this.props.render(user);
    };
}

const mapStateToProps = (appState: IApplicationState): IUserSearchState => ({
    ...appState.userSearchState,
});

export const Assignee = connect(mapStateToProps)(UnconnectedAssignee);
