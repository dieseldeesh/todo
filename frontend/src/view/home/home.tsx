import React from "react";
import { Card, Elevation, Button, Intent, MenuItem, Menu, Popover, H3 } from "@blueprintjs/core";
import styles from "./home.module.scss";
import { IApplicationState, IFileState, IUserInfo, AppView } from "../../state";
import { connect } from "react-redux";
import { ContextType, getServices } from "../../common/contextProvider";
import { History } from "history";
import { ListView } from "./listView/listView";
import { TaskForm } from "./taskForm/taskForm";
import { IProject, ITask } from "../../api";
import { AsyncLoadedValue } from "../../common/redoodle";
import { IconNames } from "@blueprintjs/icons";
import { TaskPath, ProjectPath } from "../../paths";
import classNames from "classnames";
import { isEqual, noop } from "lodash-es";
import { Slide } from "../../styles/transition";
import { Navigation } from "../../components/navigation/navigation";
import { assertNever } from "../../common/assertNever";
import { EntityWithId } from "../../common/firebase";
import { ProjectForm } from "./projectForm/projectForm";
import { NullableValue } from "../../common/nullableValue";

interface IOwnProps {
    appView: AppView.PROJECTS | AppView.TASKS;
    history: History;
    currentUser: IUserInfo;
    currentUserPhotoURL: string | null;
    taskId?: string;
    projectId?: string;
}

interface IAddTaskState {
    hasFormChanged: boolean;
    addTask: true;
    addProject: false;
    editProject: false;
}

interface IAddProjectState {
    hasFormChanged: boolean;
    addTask: false;
    addProject: true;
    editProject: false;
}

interface IEditProjectState {
    hasFormChanged: boolean;
    addTask: false;
    addProject: false;
    editProject: true;
}

interface IFalseState {
    hasFormChanged: false;
    addTask: false;
    addProject: false;
    editProject: false;
}

interface IFormInfo {
    title: string;
    form: JSX.Element;
}

type IState = IFalseState | IEditProjectState | IAddProjectState | IAddTaskState;

type IProps = IOwnProps & IFileState;

class UnconnectedHome extends React.PureComponent<IProps, IState> {
    public static contextTypes = ContextType;
    private static STRINGS = {
        CREATE_TASK_TITLE: "Create new task",
        EDIT_TASK: "Update task",
        CREATE_PROJECT_TITLE: "Create new project",
        EDIT_PROJECT_TITLE: "Update project",
        TASKS: "Tasks",
        PROJECTS: "Projects",
        NO_TASKS: "No tasks found",
        CREATE_TASK: "Create a task",
        CREATE_PROJECT: "Create a project",
        VIEW_PROJECTS: "View projects",
        EDIT_PROJECT: "Edit project",
        CREATE_SUB_PROJECT: "Create a sub project",
        VIEW_SUB_PROJECTS: "View sub projects",
        ACTIONS: "Actions",
        VIEW: "View",
        SHOW_COMPLETED_TASKS: "Show completed tasks",
        SHOW_INCOMPLETE_TASKS: "Show incomplete tasks",
        SHOW_INCOMPLETE_TASKS_AND_SUB_PROJECTS: "Show incomplete tasks and sub projects",
        BACK_TO: "Back to",
        ALL_PROJECTS: "All Projects",
        LOADING: "Loading",
    };
    public state: IState = { hasFormChanged: false, addTask: false, addProject: false, editProject: false };
    private services = getServices(this.context);

    public componentDidMount() {
        const { taskId } = this.props;
        if (taskId != null) {
            this.services.fileService.getTask(taskId);
        } else {
            this.services.fileService.clearTask();
        }
        this.fetchData();
    }

    public componentDidUpdate(prevProps: IProps) {
        const { projectId, showIncompletedTasks, taskId, appView } = this.props;
        if (taskId != null) {
            if (!isEqual(taskId, prevProps.taskId)) {
                this.services.fileService.getTask(taskId);
            }
        } else if (prevProps.taskId != null) {
            this.services.fileService.clearTask();
        }

        if (
            !isEqual(projectId, prevProps.projectId) ||
            !isEqual(showIncompletedTasks, prevProps.showIncompletedTasks) ||
            !isEqual(appView, prevProps.appView)
        ) {
            this.fetchData();
        }
    }

    private fetchData() {
        const { fileService } = this.services;
        const { projectId, showIncompletedTasks, appView } = this.props;
        if (appView === AppView.PROJECTS) {
            console.log("PROJECT VIEW");
            fileService.clearTasks();
            if (projectId != null) {
                console.log("PROJECT ID", showIncompletedTasks);
                showIncompletedTasks
                    ? fileService.listIncompleteTasksForProject(projectId)
                    : fileService.listCompletedTasksForProject(projectId);
            }
            fileService.getProject(NullableValue.of(projectId).getOrNull());
        } else {
            showIncompletedTasks ? fileService.listIncompleteTasks() : fileService.listCompletedTasks();
        }
    }

    public render() {
        const listStyles = classNames(styles.tasksView, this.shouldRenderForm() ? styles.shrink : styles.stretch);
        const { addTask, addProject } = this.state;
        const { history, appView, taskId, projectId, currentUser, currentUserPhotoURL } = this.props;
        return (
            <div className={styles.home}>
                <Navigation
                    history={history}
                    taskId={taskId}
                    appView={appView}
                    currentUser={currentUser}
                    currentUserPhotoURL={currentUserPhotoURL}
                />
                <div className={styles.body}>
                    <div className={styles.content}>
                        <Card elevation={Elevation.THREE} className={listStyles}>
                            <div className={styles.listTasks}>
                                <div className={styles.taskListActions}>
                                    {this.maybeRenderCurrentProjectMetadata()}
                                    {this.renderActions()}
                                </div>
                                <ListView
                                    taskId={taskId}
                                    projectId={projectId}
                                    onClickTask={this.editTaskClick}
                                    onClickProject={this.viewProjectClick}
                                    showNew={addTask ? "task" : addProject ? "project" : undefined}
                                    addTaskClick={this.addTaskClick}
                                    addProjectClick={this.addProjectClick}
                                    appView={appView}
                                    showAssignee={appView === AppView.PROJECTS}
                                />
                            </div>
                        </Card>
                        {this.renderForm()}
                    </div>
                </div>
            </div>
        );
    }

    private maybeRenderCurrentProjectMetadata() {
        const { currentProject } = this.props;
        const { STRINGS } = UnconnectedHome;
        if (AsyncLoadedValue.isLoadingSucceeded(currentProject)) {
            const { title, parentProjectId } = currentProject.value;
            const parentProjectName = NullableValue.of(parentProjectId)
                .map(validProjectId => {
                    const parentProject = this.props.fetchedProjects.get(validProjectId);
                    if (AsyncLoadedValue.isReady(parentProject)) {
                        return parentProject.value.title;
                    } else {
                        return STRINGS.LOADING;
                    }
                })
                .getOrDefault(STRINGS.ALL_PROJECTS);

            const backText = `${STRINGS.BACK_TO} ${parentProjectName}`;
            return (
                <>
                    <Button
                        minimal={true}
                        intent={Intent.PRIMARY}
                        text={backText}
                        onClick={this.onBackClick(NullableValue.of(parentProjectId).getOrUndefined())}
                    />
                    <H3>{title}</H3>
                </>
            );
        }
    }

    private renderActions() {
        const { projectId, appView } = this.props;
        const { STRINGS } = UnconnectedHome;
        return (
            <Popover>
                <Button
                    className={styles.actionButtonTarget}
                    intent={Intent.PRIMARY}
                    minimal={true}
                    text={STRINGS.ACTIONS}
                    rightIcon={IconNames.DOUBLE_CARET_VERTICAL}
                />
                <Menu>
                    <MenuItem icon={IconNames.ISSUE_NEW} text={STRINGS.CREATE_TASK} onClick={this.addTaskClick} />
                    {appView === AppView.PROJECTS && (
                        <MenuItem
                            icon={IconNames.FOLDER_NEW}
                            text={STRINGS.CREATE_PROJECT}
                            onClick={this.addProjectClick}
                        />
                    )}
                    {projectId && (
                        <MenuItem icon={IconNames.EDIT} text={STRINGS.EDIT_PROJECT} onClick={this.editProjectClick} />
                    )}
                    {this.renderTaskTypeMenuItem()}
                </Menu>
            </Popover>
        );
    }

    private renderTaskTypeMenuItem() {
        const { STRINGS } = UnconnectedHome;
        const { showIncompletedTasks, appView } = this.props;
        if (showIncompletedTasks) {
            return (
                <MenuItem
                    icon={IconNames.TICK_CIRCLE}
                    text={STRINGS.SHOW_COMPLETED_TASKS}
                    onClick={this.toggleTaskType(false)}
                />
            );
        } else {
            const text =
                appView === AppView.PROJECTS
                    ? STRINGS.SHOW_INCOMPLETE_TASKS_AND_SUB_PROJECTS
                    : STRINGS.SHOW_INCOMPLETE_TASKS;
            return <MenuItem icon={IconNames.WARNING_SIGN} text={text} onClick={this.toggleTaskType(true)} />;
        }
    }

    private toggleTaskType = (showIncompletedTasks: boolean) => () => {
        this.services.stateService.toggleShowIncompletedTasks(showIncompletedTasks);
    };

    private renderForm() {
        const formInfo = this.getFormInfo();
        return (
            <Slide show={formInfo != null}>
                <Card elevation={Elevation.THREE} className={classNames(styles.formView)}>
                    {this.maybeRenderFormContents(formInfo)}
                </Card>
            </Slide>
        );
    }

    private maybeRenderFormContents(formInfo: null | IFormInfo) {
        if (formInfo == null) {
            return null;
        }
        return (
            <>
                <div className={styles.formHeader}>
                    <h2>{formInfo.title}</h2>
                    <Button onClick={this.onCloseForm} minimal={true} icon={IconNames.CROSS} />
                </div>
                {formInfo.form}
            </>
        );
    }

    private onBackClick = (projectId: string | undefined) => () => {
        const { taskId } = this.props;
        this.props.history.push(new ProjectPath({ projectId, taskId }).getLocationDescriptor());
    };

    private onCloseForm = () => {
        const { taskId } = this.props;
        if (this.state.hasFormChanged) {
        } else if (taskId != null) {
            this.props.history.push(this.getPathFormClosePathLink().getLocationDescriptor());
        } else {
            this.setState({ hasFormChanged: false, addTask: false, editProject: false, addProject: false });
        }
    };

    private getFormInfo(): IFormInfo | null {
        const { taskId, currentTask, currentProject } = this.props;
        const { addTask, addProject, editProject } = this.state;
        const { STRINGS } = UnconnectedHome;
        if (taskId != null && AsyncLoadedValue.isLoadingSucceeded(currentTask)) {
            return { title: STRINGS.EDIT_TASK, form: this.renderTaskForm(currentTask.value) };
        } else if (addTask) {
            return { title: STRINGS.CREATE_TASK_TITLE, form: this.renderTaskForm() };
        } else if (addProject) {
            return { title: STRINGS.CREATE_PROJECT_TITLE, form: this.renderProjectForm() };
        } else if (editProject && AsyncLoadedValue.isLoadingSucceeded(currentProject)) {
            return { title: STRINGS.EDIT_PROJECT_TITLE, form: this.renderProjectForm(currentProject.value) };
        }
        return null;
    }

    private shouldRenderForm() {
        const { taskId, currentTask } = this.props;
        const { addTask, addProject, editProject } = this.state;
        return (
            (taskId != null && AsyncLoadedValue.isLoadingSucceeded(currentTask)) || addTask || addProject || editProject
        );
    }

    private renderTaskForm = (task?: EntityWithId<ITask>) => {
        return (
            <TaskForm
                {...this.props}
                task={task}
                onDeleteTask={this.onDeleteTask}
                onSaveTask={this.onSaveTask}
                currentUser={this.props.currentUser}
            />
        );
    };

    private renderProjectForm = (project?: EntityWithId<IProject>) => {
        const onDeleteProject = project ? this.onDeleteProject(project.id) : noop;
        return (
            <ProjectForm
                {...this.props}
                project={project}
                currentUser={this.props.currentUser}
                onDeleteProject={onDeleteProject}
                onSaveProject={this.onSaveProject}
            />
        );
    };

    private getPathFormClosePathLink(taskId?: string) {
        const { appView, projectId } = this.props;
        switch (appView) {
            case AppView.TASKS:
                return new TaskPath({ taskId });
            case AppView.PROJECTS:
                return new ProjectPath({ projectId, taskId });
            default:
                return assertNever(appView);
        }
    }

    private onDeleteTask = () => {
        this.props.history.push(this.getPathFormClosePathLink().getLocationDescriptor());
    };

    private onSaveTask = (taskId: string) => {
        this.props.history.push(this.getPathFormClosePathLink(taskId).getLocationDescriptor());
        this.setState({ hasFormChanged: false, addTask: false, addProject: false, editProject: false });
    };

    private onDeleteProject = (projectId: string) => () => {
        this.services.fileService.deleteProject(projectId).then(() => {
            this.setState({ hasFormChanged: false, addTask: false, addProject: false, editProject: false }, () => {
                this.props.history.push(new ProjectPath({}).getLocationDescriptor());
            });
        });
    };

    private onSaveProject = (projectId: string) => {
        const callback = () => {
            this.props.history.push(new ProjectPath({ projectId }).getLocationDescriptor());
        };
        if (this.props.projectId !== projectId) {
            this.setState({ addProject: false, addTask: false, hasFormChanged: false, editProject: true }, callback);
        } else {
            callback();
        }
    };

    private setHasFormChanged = (hasFormChanged: boolean) => this.setState({ hasFormChanged });

    private addTaskClick = () => {
        if (this.state.hasFormChanged) {
        } else {
            this.setState({ addProject: false, addTask: true, hasFormChanged: false, editProject: false }, () => {
                this.props.history.push(this.getPathFormClosePathLink().getLocationDescriptor());
            });
        }
    };

    private editTaskClick = (taskId: string) => {
        if (this.state.hasFormChanged) {
        } else {
            this.services.fileService.getTask(taskId);
            this.props.history.push(this.getPathFormClosePathLink(taskId).getLocationDescriptor());
        }
    };

    private viewProjectClick = (projectId: string) => {
        const { taskId } = this.props;
        if (this.state.hasFormChanged) {
        } else {
            this.props.history.push(new ProjectPath({ projectId, taskId }).getLocationDescriptor());
        }
    };

    private addProjectClick = () => {
        if (this.state.hasFormChanged) {
        } else {
            this.setState({ addProject: true, addTask: false, hasFormChanged: false, editProject: false });
        }
    };

    private editProjectClick = () => {
        if (this.state.hasFormChanged) {
        } else {
            this.setState({ addProject: false, addTask: false, hasFormChanged: false, editProject: true });
        }
    };

    private confirmButtonClick = () => {};
}

const mapStateToProps = (appState: IApplicationState): IFileState => ({
    ...appState.fileState,
});

export const Home = connect(mapStateToProps)(UnconnectedHome);
