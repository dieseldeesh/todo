import React from "react";
import { Button, Intent, NonIdealState, Tag, Text, Icon, Classes, Tooltip } from "@blueprintjs/core";
import styles from "./listView.module.scss";
import { IFileState, TaskStatus, IApplicationState } from "../../../state";
import { AsyncLoadedValue } from "../../../common/redoodle";
import { IconNames } from "@blueprintjs/icons";
import { CountableValue } from "../../../common/countableValue";
import { TaskStatusIcon, TaskDifficultyIcon, TaskImportanceIcon, TaskIconGroup } from "../taskIcon/taskIcon";
import moment from "moment";
import classNames from "classnames";
import { connect } from "react-redux";
import { EntityWithId } from "../../../common/firebase";
import { ITask, ISearchedUser } from "../../../api";
import { NullableValue } from "../../../common/nullableValue";
import { Assignee } from "../assignee/assignee";
import { AppView } from "../../../state/types";
import { IProject, FileType } from "../../../api/file";
import { assertNever } from "../../../common/assertNever";
import { times, sortBy } from "lodash-es";

interface IProps {
    showNew?: "task" | "project";
    taskId?: string;
    projectId?: string;
    addTaskClick: () => void;
    addProjectClick: () => void;
    onClickTask: (taskId: string) => void;
    onClickProject: (projectId: string) => void;
    showAssignee: boolean;
    appView: AppView;
}

class UnconnectedListView extends React.PureComponent<IProps & IFileState> {
    private static STRINGS = {
        NO_TASKS: "No tasks found",
        ADD_TASK: "Add a task",
        ADD_PROJECT: "Add a project",
        SHOW_COMPLETED_TASKS: "Show completed tasks",
        SHOW_INCOMPLETE_TASKS: "Show incomplete tasks",
        NEW_TASK: "New task",
        NEW_PROJECT: "New project",
        NO_TASKS_OR_PROJECTS: "No tasks or projects found",
        NO_TASKS_OR_SUB_PROJECTS: "No tasks or sub projects found",
        NO_COMPLETED_TASKS: "No tasks have been completed",
        SKELETON: "Skeleton",
    };

    public render() {
        return (
            <div className={styles.listFiles}>
                {this.maybeRenderNewFile()}
                {this.maybeRenderFiles()}
            </div>
        );
    }

    private maybeRenderNewFile() {
        const { STRINGS } = UnconnectedListView;
        const { showNew, showIncompletedTasks } = this.props;
        if (showNew != null && showIncompletedTasks) {
            return (
                <div className={classNames(styles.task, styles.selectedTask)}>
                    <TaskStatusIcon status={TaskStatus.NOT_STARTED} />
                    <Text ellipsize={true} className={styles.taskTitle}>
                        {showNew === "task" ? STRINGS.NEW_TASK : STRINGS.NEW_PROJECT}
                    </Text>
                    <Tag>???</Tag>
                </div>
            );
        }
    }

    private maybeRenderFiles() {
        const { tasksWithId, projectsWithId, showIncompletedTasks, showNew, appView } = this.props;
        const { STRINGS } = UnconnectedListView;
        if (
            AsyncLoadedValue.isLoadingSucceeded(tasksWithId) &&
            (appView === AppView.TASKS || AsyncLoadedValue.isLoadingSucceeded(projectsWithId))
        ) {
            const projects = AsyncLoadedValue.isLoadingSucceeded(projectsWithId) ? projectsWithId.value : [];
            const allFiles = sortBy([...tasksWithId.value, ...projects], file => file.modifiedAt);
            return CountableValue.of(allFiles)
                .map(this.renderFileWithId)
                .getValueOrDefault(showNew != null && showIncompletedTasks ? undefined : this.renderNoFiles());
        } else {
            return times(5, skeleton => (
                <div key={skeleton} className={styles.task}>
                    <Icon
                        className={classNames(styles.fileIcon, Classes.SKELETON, styles.skeletonIcon)}
                        icon={IconNames.ISSUE}
                    />
                    <Text ellipsize={true} className={classNames(styles.taskTitle, Classes.SKELETON)}>
                        {times(4, () => STRINGS.SKELETON)}
                    </Text>
                    <Tag className={Classes.SKELETON}>{STRINGS.SKELETON}</Tag>
                </div>
            ));
        }
    }

    private renderFileWithId = (file: EntityWithId<ITask | IProject>) => {
        switch (file.type) {
            case FileType.TASK:
                return this.renderTaskWithId(file);
            case FileType.PROJECT:
                return this.renderProjectWithId(file);
            default:
                return assertNever(file);
        }
    };

    private renderTaskWithId = ({
        status,
        id,
        title,
        assignee,
        dueDate,
        difficulty,
        importance,
    }: EntityWithId<ITask>) => {
        const { showAssignee, taskId } = this.props;
        const taskStyles = classNames(styles.task, { [styles.selectedTask]: taskId === id });
        return (
            <div onClick={this.onClickTask(id)} key={id} className={taskStyles}>
                <Icon className={styles.fileIcon} icon={IconNames.ISSUE} />
                <Text ellipsize={true} className={styles.taskTitle}>
                    {title}
                </Text>
                <TaskIconGroup>
                    <TaskStatusIcon status={status} />
                    {difficulty && <TaskDifficultyIcon difficulty={difficulty} />}
                    {importance && <TaskImportanceIcon importance={importance} />}
                </TaskIconGroup>
                {showAssignee && <Assignee assignee={assignee} render={this.renderAssignee} />}
                {this.maybeRenderDueDate(dueDate)}
            </div>
        );
    };

    private renderProjectWithId = ({ id, title }: EntityWithId<IProject>) => {
        return (
            <div onClick={this.onClickProject(id)} key={id} className={styles.task}>
                <Icon className={styles.fileIcon} icon={IconNames.FOLDER_CLOSE} />
                <Text ellipsize={true} className={styles.taskTitle}>
                    {title}
                </Text>
            </div>
        );
    };

    private renderAssignee = (assignee: ISearchedUser) => {
        const { displayName, email, photoURL } = assignee;
        const displayContent = displayName == null ? email : displayName;
        return (
            <div className={styles.assignee}>
                <Tooltip content={displayContent}>{this.renderProfilePicture(displayContent, photoURL)}</Tooltip>
            </div>
        );
    };

    private renderProfilePicture(displayContent: string, photoURL: string | undefined) {
        if (photoURL != null && photoURL.length > 0) {
            return <img src={photoURL} alt={displayContent} className={styles.profilePicture} />;
        } else {
            return <Icon className={styles.profilePicture} icon={IconNames.USER} iconSize={30} />;
        }
    }

    private maybeRenderDueDate(dueDate: Date | null) {
        return NullableValue.of(dueDate)
            .map(validDueDate => <Tag>{moment(validDueDate).fromNow()}</Tag>)
            .getOrUndefined();
    }

    private onClickTask = (taskId: string) => () => this.props.onClickTask(taskId);

    private onClickProject = (projectId: string) => () => this.props.onClickProject(projectId);

    private renderNoFiles = () => {
        const { STRINGS } = UnconnectedListView;
        const { appView, showIncompletedTasks, projectId } = this.props;
        const title = !showIncompletedTasks
            ? STRINGS.NO_COMPLETED_TASKS
            : appView === AppView.PROJECTS
            ? projectId
                ? STRINGS.NO_TASKS_OR_SUB_PROJECTS
                : STRINGS.NO_TASKS_OR_PROJECTS
            : STRINGS.NEW_TASK;
        return <NonIdealState title={title} icon={IconNames.ERROR} action={this.renderAddTask()} />;
    };

    private renderAddTask() {
        const { STRINGS } = UnconnectedListView;
        const { appView, showIncompletedTasks, addProjectClick, addTaskClick } = this.props;
        if (!showIncompletedTasks) {
            return undefined;
        }
        return (
            <>
                <Button intent={Intent.PRIMARY} text={STRINGS.ADD_TASK} onClick={addTaskClick} />
                {appView === AppView.PROJECTS && (
                    <Button intent={Intent.SUCCESS} text={STRINGS.ADD_PROJECT} onClick={addProjectClick} />
                )}
            </>
        );
    }
}

const mapStateToProps = (appState: IApplicationState): IFileState => ({ ...appState.fileState });

export const ListView = connect(mapStateToProps)(UnconnectedListView);
