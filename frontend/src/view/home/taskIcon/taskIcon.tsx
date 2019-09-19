import React from "react";
import styles from "./taskIcon.module.scss";
import { TaskStatus, TaskDifficulty, TaskImportance } from "../../../state";
import { Icon, Tag } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import classNames from "classnames";

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
    [TaskStatus.NOT_STARTED]: styles.taskStatusNotStarted,
    [TaskStatus.IN_PROGRESS]: styles.taskStatusInProgress,
    [TaskStatus.BLOCKED]: styles.taskStatusBlocked,
    [TaskStatus.COMPLETED]: styles.taskStatusCompleted,
};

const TASK_STATUS_TAG_STYLES: Record<TaskStatus, string> = {
    [TaskStatus.NOT_STARTED]: styles.taskStatusNotStartedTag,
    [TaskStatus.IN_PROGRESS]: styles.taskStatusInProgressTag,
    [TaskStatus.BLOCKED]: styles.taskStatusBlockedTag,
    [TaskStatus.COMPLETED]: styles.taskStatusCompletedTag,
};

interface IMinimalProps {
    minimal?: boolean;
}

export const TaskStatusIcon: React.SFC<{ status: TaskStatus } & IMinimalProps> = ({ status, minimal }) => {
    if (minimal || status == null) {
        const classes = classNames(styles.taskStatusIcon, TASK_STATUS_STYLES[status]);
        return <Icon iconSize={12} className={classes} icon={IconNames.FULL_CIRCLE} />;
    } else {
        const classes = classNames(styles.taskStatusIcon, TASK_STATUS_TAG_STYLES[status]);
        return <Tag className={classes}>{splitEnum(status)}</Tag>;
    }
};

const TASK_DIFFICULTY_STYLES: Record<TaskDifficulty, string> = {
    [TaskDifficulty.EASY]: styles.taskDifficultyEasy,
    [TaskDifficulty.MEDIUM]: styles.taskDifficultyMedium,
    [TaskDifficulty.HARD]: styles.taskDifficultyHard,
};

const TASK_DIFFICULTY_TAG_STYLES: Record<TaskDifficulty, string> = {
    [TaskDifficulty.EASY]: styles.taskDifficultyEasyTag,
    [TaskDifficulty.MEDIUM]: styles.taskDifficultyMediumTag,
    [TaskDifficulty.HARD]: styles.taskDifficultyHardTag,
};

export const TaskDifficultyIcon: React.SFC<{ difficulty: TaskDifficulty } & IMinimalProps> = ({
    difficulty,
    minimal,
}) => {
    if (minimal || difficulty == null) {
        const classes = classNames(styles.taskStatusIcon, TASK_DIFFICULTY_STYLES[difficulty]);
        return <Icon iconSize={12} className={classes} icon={IconNames.FULL_CIRCLE} />;
    } else {
        const classes = classNames(styles.taskStatusIcon, TASK_DIFFICULTY_TAG_STYLES[difficulty]);
        return <Tag className={classes}>{splitEnum(difficulty)}</Tag>;
    }
};

const TASK_IMPORTANCE_STYLES: Record<TaskImportance, string> = {
    [TaskImportance.P0]: styles.taskImportanceP0,
    [TaskImportance.P1]: styles.taskImportanceP1,
    [TaskImportance.P2]: styles.taskImportanceP2,
    [TaskImportance.P3]: styles.taskImportanceP3,
    [TaskImportance.P4]: styles.taskImportanceP4,
};

const TASK_IMPORTANCE_TAG_STYLES: Record<TaskImportance, string> = {
    [TaskImportance.P0]: styles.taskImportanceP0Tag,
    [TaskImportance.P1]: styles.taskImportanceP1Tag,
    [TaskImportance.P2]: styles.taskImportanceP2Tag,
    [TaskImportance.P3]: styles.taskImportanceP3Tag,
    [TaskImportance.P4]: styles.taskImportanceP4Tag,
};

export const TaskImportanceIcon: React.SFC<{ importance: TaskImportance } & IMinimalProps> = ({
    importance,
    minimal,
}) => {
    if (minimal || importance == null) {
        const classes = classNames(styles.taskStatusIcon, TASK_IMPORTANCE_STYLES[importance]);
        return <Icon iconSize={12} className={classes} icon={IconNames.FULL_CIRCLE} />;
    } else {
        const classes = classNames(styles.taskStatusIcon, TASK_IMPORTANCE_TAG_STYLES[importance]);
        return <Tag className={classes}>{splitEnum(importance)}</Tag>;
    }
};

export const TaskIconGroup: React.SFC = ({ children }) => <div className={styles.taskIconGroup}>{children}</div>;

function splitEnum(value: string) {
    return value.split("_").join(" ");
}
