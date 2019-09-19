import React from "react";
import { Button, Navbar, Alignment, Tooltip } from "@blueprintjs/core";
import { ContextType, getServices } from "../../common/contextProvider";
import { IconNames } from "@blueprintjs/icons";
import { History } from "history";
import { ProfilePath, TaskPath, ProjectPath } from "../../paths";
import { AppView } from "../../state";
import styles from "./navigation.module.scss";
import { UserIcon } from "../userIcon/userIcon";
import { IUserInfo } from "../../state/types";

interface IProps {
    history: History;
    taskId: string | undefined;
    appView: AppView;
    currentUser: IUserInfo;
    currentUserPhotoURL: string | null;
}

export class Navigation extends React.PureComponent<IProps> {
    public static contextTypes = ContextType;
    private static STRINGS = {
        TITLE: "Todolooo",
        CREATE: "Create new task",
        EDIT: "Update task",
        TASKS: "My tasks",
        PROJECTS: "Projects",
        SIGN_OUT: "Sign out",
        VIEW_PROFILE: "View profile",
    };
    private services = getServices(this.context);

    public render() {
        const { STRINGS } = Navigation;
        const { appView } = this.props;
        return (
            <Navbar>
                <Navbar.Group align={Alignment.LEFT}>
                    <Navbar.Heading>{STRINGS.TITLE}</Navbar.Heading>
                    <Navbar.Divider />
                    <Button
                        active={appView === AppView.TASKS}
                        onClick={this.viewTasks}
                        minimal={true}
                        icon={IconNames.ISSUE}
                        text={STRINGS.TASKS}
                    />
                    <Button
                        active={appView === AppView.PROJECTS}
                        onClick={this.viewProjects}
                        minimal={true}
                        icon={IconNames.PROJECTS}
                        text={STRINGS.PROJECTS}
                    />
                </Navbar.Group>
                <Navbar.Group align={Alignment.RIGHT}>
                    {this.renderProfileButton()}
                    <Tooltip content={STRINGS.SIGN_OUT}>
                        <Button onClick={this.signOut} minimal={true} icon={IconNames.LOG_OUT} />
                    </Tooltip>
                </Navbar.Group>
            </Navbar>
        );
    }

    private renderProfileButton() {
        const { currentUser, currentUserPhotoURL, appView } = this.props;
        if (currentUserPhotoURL) {
            return (
                <span className={styles.profileButton} onClick={this.viewProfile}>
                    <UserIcon currentUser={currentUser} currentUserPhotoURL={currentUserPhotoURL} />
                </span>
            );
        } else {
            return (
                <Button
                    active={appView === AppView.PROFILE}
                    onClick={this.viewProfile}
                    minimal={true}
                    icon={IconNames.PERSON}
                />
            );
        }
    }

    private signOut = () => this.services.userService.signOut();

    private viewProfile = () => this.props.history.push(new ProfilePath().getLocationDescriptor());

    private viewTasks = () =>
        this.props.history.push(new TaskPath({ taskId: this.props.taskId }).getLocationDescriptor());

    private viewProjects = () =>
        this.props.history.push(new ProjectPath({ taskId: this.props.taskId }).getLocationDescriptor());
}
