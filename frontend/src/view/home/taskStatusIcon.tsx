import React from "react";
import styles from "./taskStatusIcon.module.scss";
import { TaskStatus } from "../../state/types";
import { Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import classNames from "classnames";

interface IProps {
    status: TaskStatus;
}

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
    [TaskStatus.NOT_STARTED]: styles.taskStatusNotStarted,
    [TaskStatus.IN_PROGRESS]: styles.taskStatusInProgress,
    [TaskStatus.BLOCKED]: styles.taskStatusBlocked,
    [TaskStatus.COMPLETED]: styles.taskStatusCompleted,
};

export const TaskStatusIcon: React.SFC<IProps> = ({ status }) => (
    <Icon
        iconSize={12}
        className={classNames(styles.taskStatusIcon, TASK_STATUS_STYLES[status])}
        icon={IconNames.FULL_CIRCLE}
    />
);
