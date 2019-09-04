import React from "react";
import { Button, Intent, NonIdealState, Tag, Text } from "@blueprintjs/core";
import styles from "./listTasks.module.scss";
import { ITaskState, AppAction, TaskStatus } from "../../state/types";
import { AsyncLoadedValue } from "../../common/redoodle";
import { IconNames } from "@blueprintjs/icons";
import { CountableValue } from "../../common/countableValue";
import { ITaskWithId } from "../../api";
import { PathLink } from "../../common/navigationWithPath";
import { AddPath } from "../../paths/add";
import { EditPath } from "../../paths/edit";
import { TaskStatusIcon } from "./taskStatusIcon";
import moment from "moment";
import { ContextType, getServices } from "../../common/contextProvider";
import { ABBREVIATED_DATE_TIME_FORMAT } from "../../common/dateTimeFormat";
import classNames from "classnames";

interface IProps extends ITaskState {
    action: AppAction;
    taskId?: string;
}

export default class ListTasks extends React.PureComponent<IProps> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);
    private static STRINGS = {
        NO_TASKS: "No tasks found",
        ADD_TASK: "Add a task",
        SHOW_COMPLETED_TASKS: "Show completed tasks",
        SHOW_INCOMPLETE_TASKS: "Show incomplete tasks",
    };

    public render() {
        const { STRINGS } = ListTasks;
        return (
            <div className={styles.listTasks}>
                <div className={styles.taskListActions}>
                    <PathLink className={styles.addButton} to={new AddPath()}>
                        <Button
                            className={styles.addButtonTarget}
                            icon={IconNames.PLUS}
                            intent={Intent.PRIMARY}
                            minimal={true}
                            text={STRINGS.ADD_TASK}
                        />
                    </PathLink>
                    {this.renderToggleTaskType()}
                </div>
                {this.maybeRenderNewTask()}
                {this.maybeRenderTasks()}
            </div>
        );
    }

    private maybeRenderNewTask() {
        const { action, showIncompletedTasks } = this.props;
        if (action === AppAction.ADD_TASK && showIncompletedTasks) {
            return (
                <div className={classNames(styles.task, styles.selectedTask)}>
                    <TaskStatusIcon status={TaskStatus.NOT_STARTED} />
                    <div className={styles.taskInfo}>
                        <Text ellipsize={true} className={styles.taskTitle}>
                            New task
                        </Text>
                    </div>
                    <Tag>???</Tag>
                </div>
            );
        }
    }

    private renderToggleTaskType() {
        const { STRINGS } = ListTasks;
        if (this.props.showIncompletedTasks) {
            return (
                <Button
                    className={styles.addButtonTarget}
                    icon={IconNames.TICK_CIRCLE}
                    intent={Intent.SUCCESS}
                    minimal={true}
                    text={STRINGS.SHOW_COMPLETED_TASKS}
                    onClick={this.toggleTaskType(false)}
                />
            );
        } else {
            return (
                <Button
                    className={styles.addButtonTarget}
                    icon={IconNames.WARNING_SIGN}
                    intent={Intent.WARNING}
                    minimal={true}
                    text={STRINGS.SHOW_INCOMPLETE_TASKS}
                    onClick={this.toggleTaskType(true)}
                />
            );
        }
    }

    private toggleTaskType = (showIncompletedTasks: boolean) => () => {
        this.services.stateService.toggleShowIncompletedTasks(showIncompletedTasks);
    };

    private maybeRenderTasks() {
        const { tasksWithId, showIncompletedTasks, action } = this.props;
        if (AsyncLoadedValue.isLoadingSucceeded(tasksWithId)) {
            const filteredTasks = tasksWithId.value.filter(
                task => showIncompletedTasks === (task.status !== TaskStatus.COMPLETED),
            );
            const renderedTasks = CountableValue.of(filteredTasks)
                .map(this.renderTaskWithId)
                .getValueOrDefault(
                    action === AppAction.ADD_TASK && showIncompletedTasks ? undefined : this.renderNoTasks(),
                );
            return <div className={styles.taskList}>{renderedTasks}</div>;
        }
    }

    private renderTaskWithId = ({ status, id, title, author, dueDate }: ITaskWithId) => {
        const taskStyles = classNames(styles.task, { [styles.selectedTask]: this.props.taskId === id });
        return (
            <PathLink to={new EditPath({ taskId: id })} key={id} className={taskStyles}>
                <TaskStatusIcon status={status} />
                <div className={styles.taskInfo}>
                    <Text ellipsize={true} className={styles.taskTitle}>
                        {title}
                    </Text>
                    <div>{author}</div>
                </div>
                <Tag>{moment(dueDate).format(ABBREVIATED_DATE_TIME_FORMAT)}</Tag>
            </PathLink>
        );
    };

    private renderNoTasks = () => {
        const { STRINGS } = ListTasks;
        return <NonIdealState title={STRINGS.NO_TASKS} icon={IconNames.ERROR} action={this.renderAddTask()} />;
    };

    private renderAddTask() {
        const { STRINGS } = ListTasks;
        return (
            <PathLink className={styles.addButton} to={new AddPath()}>
                <Button intent={Intent.PRIMARY} text={STRINGS.ADD_TASK} />
            </PathLink>
        );
    }
}
