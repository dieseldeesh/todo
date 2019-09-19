import React from "react";
import styles from "./taskIcon.module.scss";
import { TaskStatus, TaskDifficulty, TaskImportance } from "../../../state";
import { Icon } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import classNames from "classnames";

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
    [TaskStatus.NOT_STARTED]: styles.taskStatusNotStarted,
    [TaskStatus.IN_PROGRESS]: styles.taskStatusInProgress,
    [TaskStatus.BLOCKED]: styles.taskStatusBlocked,
    [TaskStatus.COMPLETED]: styles.taskStatusCompleted,
};

interface IMinimalProps {
    minimal?: boolean;
}

export const TaskStatusIcon: React.SFC<{ status: TaskStatus } & IMinimalProps> = ({ status, minimal }) => {
    if (minimal) {
        return (
            <Icon
                iconSize={12}
                className={classNames(styles.taskStatusIcon, TASK_STATUS_STYLES[status])}
                icon={IconNames.FULL_CIRCLE}
            />
        );
    }
};

const TASK_DIFFICULTY_STYLES: Record<TaskDifficulty, string> = {
    [TaskDifficulty.EASY]: styles.taskDifficultyEasy,
    [TaskDifficulty.MEDIUM]: styles.taskDifficultyMedium,
    [TaskDifficulty.HARD]: styles.taskDifficultyHard,
};

export const TaskDifficultyIcon: React.SFC<{ difficulty: TaskDifficulty } & IMinimalProps> = ({
    difficulty,
    minimal,
}) => {
    if (minimal) {
        return (
            <Icon
                iconSize={12}
                className={classNames(
                    styles.taskStatusIcon,
                    difficulty == null ? styles.unset : TASK_DIFFICULTY_STYLES[difficulty],
                )}
                icon={IconNames.FULL_CIRCLE}
            />
        );
    }
};

const TASK_IMPORTANCE_STYLES: Record<TaskImportance, string> = {
    [TaskImportance.P0]: styles.taskImportanceP0,
    [TaskImportance.P1]: styles.taskImportanceP1,
    [TaskImportance.P2]: styles.taskImportanceP2,
    [TaskImportance.P3]: styles.taskImportanceP3,
    [TaskImportance.P4]: styles.taskImportanceP4,
};

export const TaskImportanceIcon: React.SFC<{ importance: TaskImportance } & IMinimalProps> = ({
    importance,
    minimal,
}) => {
    if (minimal) {
        return (
            <Icon
                iconSize={12}
                className={classNames(
                    styles.taskStatusIcon,
                    importance == null ? styles.unset : TASK_IMPORTANCE_STYLES[importance],
                )}
                icon={IconNames.FULL_CIRCLE}
            />
        );
    }
};
