import React from "react";
import styles from "./taskForm.module.scss";
import {
    TaskStatus,
    TaskDifficulty,
    TaskImportance,
    IUserInfo,
    IApplicationState,
    IUserSearchState,
    IFileState,
} from "../../../state";
import { handleStringChange } from "../../../common/handleStringChange";
import { ContextType, getServices } from "../../../common/contextProvider";
import { DatePicker } from "@blueprintjs/datetime";
import { History } from "history";
import {
    FormGroup,
    InputGroup,
    Button,
    Intent,
    TextArea,
    MenuItem,
    Text,
    Popover,
    ButtonGroup,
} from "@blueprintjs/core";
import { isEqual, isEmpty, toUpper } from "lodash-es";
import { IconNames } from "@blueprintjs/icons";
import { NullableValue } from "../../../common/nullableValue";
import { Select, ItemRenderer, Omnibar, ItemPredicate } from "@blueprintjs/select";
import { highlightText } from "../../../common/highlight";
import moment from "moment";
import { TaskStatusIcon, TaskImportanceIcon, TaskDifficultyIcon } from "../taskIcon/taskIcon";
import { DATE_TIME_FORMAT } from "../../../common/dateTimeFormat";
import { EntityWithId } from "../../../common/firebase";
import { ITask, FileType } from "../../../api";
import { AsyncLoadedValue } from "../../../common/redoodle";
import { ISearchedUser } from "../../../api";
import { connect } from "react-redux";
import { Assignee } from "../assignee/assignee";
import { isEmptyEqual } from "../../../common/isEmptyEqual";

const UserOmnibar = Omnibar.ofType<ISearchedUser>();

interface IOwnProps {
    history: History;
    task?: EntityWithId<ITask>;
    projectId?: string;
    currentUser: IUserInfo;
    onSaveTask: (taskId: string) => void;
    onDeleteTask: () => void;
}

type IProps = IOwnProps & IUserSearchState & IFileState;

interface IState {
    isOmnibarOpen: boolean;
    title: string;
    assignee: string;
    status: TaskStatus;
    dueDate: Date | null;
    description: string;
    difficulty: TaskDifficulty | null;
    importance: TaskImportance | null;
    prevTitle: string;
    prevAssignee: string;
    prevStatus: TaskStatus;
}

const DEFAULT_STATE: IState = {
    isOmnibarOpen: false,
    title: "",
    assignee: "",
    dueDate: null,
    description: "",
    status: TaskStatus.NOT_STARTED,
    difficulty: null,
    importance: null,
    prevTitle: "",
    prevAssignee: "",
    prevStatus: TaskStatus.NOT_STARTED,
};

const TaskStatusSelect = Select.ofType<TaskStatus>();
const TaskDifficultySelect = Select.ofType<TaskDifficulty>();
const TaskImportanceSelect = Select.ofType<TaskImportance>();

const TASK_STATUS_RECORD: Record<TaskStatus, true> = {
    [TaskStatus.NOT_STARTED]: true,
    [TaskStatus.IN_PROGRESS]: true,
    [TaskStatus.BLOCKED]: true,
    [TaskStatus.COMPLETED]: true,
};

const TASK_STATUSES = Object.keys(TASK_STATUS_RECORD) as TaskStatus[];

const TASK_DIFFICULTY_RECORD: Record<TaskDifficulty, true> = {
    [TaskDifficulty.EASY]: true,
    [TaskDifficulty.MEDIUM]: true,
    [TaskDifficulty.HARD]: true,
};

const TASK_DIFFICULTIES = Object.keys(TASK_DIFFICULTY_RECORD) as TaskDifficulty[];

const TASK_IMPORTANCE_RECORD: Record<TaskImportance, true> = {
    [TaskImportance.P0]: true,
    [TaskImportance.P1]: true,
    [TaskImportance.P2]: true,
    [TaskImportance.P3]: true,
    [TaskImportance.P4]: true,
};

const TASK_IMPORTANCES = Object.keys(TASK_IMPORTANCE_RECORD) as TaskImportance[];

class UnconnectedTaskForm extends React.PureComponent<IProps, IState> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);
    public state: IState = DEFAULT_STATE;
    private static STRINGS = {
        TITLE_LABEL: "Title",
        STATUS_LABEL: "Status",
        DIFFICULTY_LABEL: "Difficulty",
        IMPORTANCE_LABEL: "Importance",
        ASSIGNEE_LABEL: "Assignee",
        DUE_DATE_LABEL: "Due date",
        DESCRIPTION_LABEL: "Description",
        TITLE_PLACEHOLDER: "Write a task name",
        ASSIGNEE_PLACEHOLDER: "Assign to someone",
        DESCRIPTION_PLACEHOLDER: "Write the description",
        REQUIRED: "(required)",
        UPDATE: "Update",
        CREATE: "Create",
        DELETE: "Delete",
        MUST_HAVE_ASSIGNEE: "Assignee must be set",
        MUST_HAVE_TITLE: "Title must be set",
        NO_DUE_DATE: "No due date set",
    };

    public componentDidMount() {
        this.assignPropsToStateAndFetchProject(this.props.task);
    }

    public componentDidUpdate(prevProps: IProps) {
        if (!isEqual(prevProps.task, this.props.task)) {
            this.assignPropsToStateAndFetchProject(this.props.task);
        }
    }

    private assignPropsToStateAndFetchProject(task?: EntityWithId<ITask>) {
        const { projectId, currentUser } = this.props;
        const currentProjectId = NullableValue.of(projectId).getOrDefault(currentUser.uid);
        this.services.fileService.fetchProject(currentProjectId);
        if (task == null) {
            this.setState(DEFAULT_STATE);
        } else {
            const { assignee, description, dueDate, title, status, importance, difficulty } = task;
            this.setState({ title, assignee, dueDate, description, status, importance, difficulty });
        }
    }

    public render() {
        return (
            <div className={styles.formSection}>
                {this.renderForm()}
                {this.renderFormActions()}
            </div>
        );
    }

    private renderForm() {
        const { assignee, description, dueDate, title } = this.state;
        const { searchedUsers } = this.props;
        const { STRINGS } = UnconnectedTaskForm;
        const titleHelperText = this.getTitleHelperText();
        const assigneeHelperText = this.getAssigneeHelperText();
        const userInfos = AsyncLoadedValue.isReady(searchedUsers) ? searchedUsers.value : [];
        return (
            <div className={styles.form}>
                <FormGroup
                    intent={isEmpty(titleHelperText) ? Intent.NONE : Intent.DANGER}
                    helperText={titleHelperText}
                    label={STRINGS.TITLE_LABEL}
                    labelFor="title-input"
                    labelInfo={STRINGS.REQUIRED}
                >
                    <InputGroup
                        id="title-input"
                        placeholder={STRINGS.TITLE_PLACEHOLDER}
                        value={title}
                        onChange={handleStringChange(this.onTitleChange)}
                    />
                </FormGroup>
                <div className={styles.taskGrid}>
                    {this.maybeRenderTaskStatusInput()}
                    <FormGroup
                        intent={isEmpty(assigneeHelperText) ? Intent.NONE : Intent.DANGER}
                        helperText={assigneeHelperText}
                        label={STRINGS.ASSIGNEE_LABEL}
                        labelFor="assignee-input"
                        labelInfo={STRINGS.REQUIRED}
                    >
                        <ButtonGroup className={styles.taskSelectGroup}>
                            {!isEmpty(assignee) && <Button icon={IconNames.CROSS} onClick={this.onAssigneeClear} />}
                            <Button
                                className={styles.taskSelectButton}
                                id="assignee-input"
                                placeholder={STRINGS.ASSIGNEE_PLACEHOLDER}
                                text={
                                    isEmpty(assignee) ? (
                                        STRINGS.ASSIGNEE_PLACEHOLDER
                                    ) : (
                                        <Assignee assignee={assignee} render={this.renderLoadedUser} />
                                    )
                                }
                                onClick={this.onOmnibarOpen}
                            />
                        </ButtonGroup>
                        <UserOmnibar
                            itemPredicate={this.filterUsers}
                            itemRenderer={this.renderUser}
                            isOpen={this.state.isOmnibarOpen}
                            noResults={<MenuItem disabled={true} text="No results." />}
                            onItemSelect={this.handleItemSelect}
                            items={userInfos}
                            onClose={this.onOmnibarClose}
                            onQueryChange={this.onQueryChange}
                        />
                    </FormGroup>
                    {this.maybeRenderTaskDifficultyInput()}
                    {this.maybeRenderTaskImportanceInput()}
                </div>

                <FormGroup label={STRINGS.DUE_DATE_LABEL} labelFor="due-input">
                    <Popover targetClassName={styles.dateInputPopoverTarget}>
                        <Button className={styles.dateInput} text={this.formatDueDate(dueDate)} />
                        <DatePicker
                            minDate={new Date()}
                            onChange={this.onDueDateChange}
                            value={NullableValue.of(dueDate).getOrUndefined()}
                            showActionsBar={true}
                        />
                    </Popover>
                </FormGroup>
                <FormGroup label={STRINGS.DESCRIPTION_LABEL} labelFor="description-input">
                    <TextArea
                        className={styles.taskDescription}
                        id="description-input"
                        growVertically={false}
                        placeholder={STRINGS.DESCRIPTION_PLACEHOLDER}
                        onChange={handleStringChange(this.onDescriptionChange)}
                        value={description}
                    />
                </FormGroup>
            </div>
        );
    }

    private renderLoadedUser = (user: ISearchedUser) => {
        const { displayName, email } = user;
        return <Text ellipsize={true}>{displayName == null ? email : displayName}</Text>;
    };

    private onQueryChange = (query: string) => {
        this.services.userService.searchUsers(query);
    };

    private onOmnibarOpen = () => this.setState({ isOmnibarOpen: true });

    private onOmnibarClose = () => this.setState({ isOmnibarOpen: false });

    private formatDueDate(dueDate: Date | null) {
        const { STRINGS } = UnconnectedTaskForm;
        return NullableValue.of(dueDate)
            .map(validDueDate => moment(validDueDate).format(DATE_TIME_FORMAT))
            .getOrDefault(STRINGS.NO_DUE_DATE);
    }

    private filterUsers: ItemPredicate<ISearchedUser> = (query, user, _index) => {
        const { projectId, currentUser } = this.props;
        const currentProjectId = NullableValue.of(projectId).getOrDefault(currentUser.uid);
        const project = this.props.fetchedProjects.get(currentProjectId);
        if (project == null || !AsyncLoadedValue.isLoadingSucceeded(project)) {
            return false;
        }
        const { displayName, email, id } = user;
        const normalizedDisplay = displayName ? displayName.toLowerCase() : "";
        const normalizedEmail = email ? email.toLowerCase() : "";
        const normalizedQuery = query.toLowerCase();
        return (
            `${normalizedDisplay} ${normalizedEmail} ${id}`.indexOf(normalizedQuery) >= 0 &&
            project.value.members.includes(user.id)
        );
    };

    private renderUser: ItemRenderer<ISearchedUser> = (
        { id, displayName, email },
        { handleClick, modifiers, query },
    ) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        const userEmail = NullableValue.of(email);
        const text = displayName == null ? userEmail.getOrDefault("") : displayName;
        const label = displayName == null ? undefined : userEmail.getOrUndefined();
        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                label={label}
                key={id}
                onClick={handleClick}
                text={highlightText(text, query)}
            />
        );
    };

    private maybeRenderTaskStatusInput() {
        const { STRINGS } = UnconnectedTaskForm;
        const { status } = this.state;
        return (
            <FormGroup label={STRINGS.STATUS_LABEL} labelFor="status-input" labelInfo={STRINGS.REQUIRED}>
                <ButtonGroup className={styles.taskSelectGroup}>
                    <TaskStatusSelect
                        items={TASK_STATUSES}
                        itemRenderer={this.renderTaskStatus}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        onItemSelect={this.onStatusChange}
                    >
                        <Button
                            className={styles.taskSelectButton}
                            text={this.renderTaskStatusMenuItemContent(status)}
                            rightIcon={IconNames.DOUBLE_CARET_VERTICAL}
                        />
                    </TaskStatusSelect>
                </ButtonGroup>
            </FormGroup>
        );
    }

    private maybeRenderTaskDifficultyInput() {
        const { STRINGS } = UnconnectedTaskForm;
        const { difficulty } = this.state;
        return (
            <FormGroup label={STRINGS.DIFFICULTY_LABEL} labelFor="difficulty-input">
                <ButtonGroup className={styles.taskSelectGroup}>
                    {difficulty != null ? <Button onClick={this.onClearDifficulty} icon={IconNames.CROSS} /> : null}
                    <TaskDifficultySelect
                        items={TASK_DIFFICULTIES}
                        itemRenderer={this.renderTaskDifficulty}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        onItemSelect={this.onDifficultyChange}
                    >
                        <Button
                            className={styles.taskSelectButton}
                            text={this.renderTaskDifficultyMenuItemContent(difficulty)}
                            rightIcon={IconNames.DOUBLE_CARET_VERTICAL}
                        />
                    </TaskDifficultySelect>
                </ButtonGroup>
            </FormGroup>
        );
    }

    private maybeRenderTaskImportanceInput() {
        const { STRINGS } = UnconnectedTaskForm;
        const { importance } = this.state;
        return (
            <FormGroup label={STRINGS.IMPORTANCE_LABEL} labelFor="importance-input">
                <ButtonGroup className={styles.taskSelectGroup}>
                    {importance != null ? <Button onClick={this.onClearImportance} icon={IconNames.CROSS} /> : null}
                    <TaskImportanceSelect
                        items={TASK_IMPORTANCES}
                        itemRenderer={this.renderTaskImportance}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        onItemSelect={this.onImportanceChange}
                    >
                        <Button
                            className={styles.taskSelectButton}
                            text={this.renderTaskImportanceMenuItemContent(importance)}
                            rightIcon={IconNames.DOUBLE_CARET_VERTICAL}
                        />
                    </TaskImportanceSelect>
                </ButtonGroup>
            </FormGroup>
        );
    }

    private renderTaskStatus: ItemRenderer<TaskStatus> = (status: TaskStatus, { handleClick, modifiers, query }) => {
        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                key={status}
                onClick={handleClick}
                text={this.renderTaskStatusMenuItemContent(status, query)}
            />
        );
    };

    private renderTaskDifficulty: ItemRenderer<TaskDifficulty> = (
        difficulty: TaskDifficulty,
        { handleClick, modifiers, query },
    ) => {
        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                key={difficulty}
                onClick={handleClick}
                text={this.renderTaskDifficultyMenuItemContent(difficulty, query)}
            />
        );
    };

    private renderTaskImportance: ItemRenderer<TaskImportance> = (
        importance: TaskImportance,
        { handleClick, modifiers, query },
    ) => {
        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                key={importance}
                onClick={handleClick}
                text={this.renderTaskImportanceMenuItemContent(importance, query)}
            />
        );
    };

    private renderTaskStatusMenuItemContent(status: TaskStatus, query: string = "") {
        return (
            <div className={styles.taskStatus}>
                <TaskStatusIcon status={status} />
                <Text>{highlightText(this.formatStatus(status), query)}</Text>
            </div>
        );
    }

    private renderTaskDifficultyMenuItemContent(difficulty: TaskDifficulty | null, query: string = "") {
        return (
            <div className={styles.taskStatus}>
                {difficulty != null ? <TaskDifficultyIcon difficulty={difficulty} /> : null}
                <Text>{difficulty == null ? "Not set" : highlightText(difficulty, query)}</Text>
            </div>
        );
    }

    private renderTaskImportanceMenuItemContent(importance: TaskImportance | null, query: string = "") {
        return (
            <div className={styles.taskStatus}>
                {importance != null ? <TaskImportanceIcon importance={importance} /> : null}
                <Text>{importance == null ? "Not set" : highlightText(toUpper(importance), query)}</Text>
            </div>
        );
    }

    private formatStatus(status: TaskStatus) {
        return status.split("_").join(" ");
    }

    private getTitleHelperText() {
        const { title, prevTitle } = this.state;
        const { STRINGS } = UnconnectedTaskForm;
        if (isEmpty(title) && !isEmpty(prevTitle)) {
            return STRINGS.MUST_HAVE_TITLE;
        }
    }

    private getAssigneeHelperText() {
        const { assignee, prevAssignee } = this.state;
        const { STRINGS } = UnconnectedTaskForm;
        if (isEmpty(assignee) && !isEmpty(prevAssignee)) {
            return STRINGS.MUST_HAVE_ASSIGNEE;
        }
    }

    private renderFormActions() {
        const { STRINGS } = UnconnectedTaskForm;
        const saveButtonText = this.props.task == null ? STRINGS.CREATE : STRINGS.UPDATE;
        return (
            <div className={styles.actions}>
                {this.maybeRenderDeleteButton()}
                <Button
                    disabled={this.isSaveDisabled()}
                    icon={IconNames.FLOPPY_DISK}
                    intent={Intent.SUCCESS}
                    text={saveButtonText}
                    onClick={this.saveTask}
                />
            </div>
        );
    }

    private isSaveDisabled() {
        const { assignee, title } = this.state;
        return isEmpty(assignee) || isEmpty(title) || !this.hasFormChanged();
    }

    private hasFormChanged() {
        return NullableValue.of(this.props.task)
            .map(task => {
                const {
                    assignee: prevAssignee,
                    description: prevDescription,
                    dueDate: prevDueDate,
                    title: prevTitle,
                    status: prevStatus,
                    importance: prevImportance,
                    difficulty: prevDifficulty,
                } = task;
                const { assignee, description, dueDate, title, status, importance, difficulty } = this.state;
                const dueDatePrimitive = NullableValue.of(dueDate)
                    .map(date => moment(date).valueOf())
                    .getOrNull();
                const prevDueDatePrimitive = NullableValue.of(prevDueDate)
                    .map(date => moment(date).valueOf())
                    .getOrNull();
                return (
                    !isEmptyEqual(assignee, prevAssignee) ||
                    !isEmptyEqual(description, prevDescription) ||
                    !isEmptyEqual(dueDatePrimitive, prevDueDatePrimitive) ||
                    !isEmptyEqual(title, prevTitle) ||
                    !isEmptyEqual(status, prevStatus) ||
                    !isEmptyEqual(importance, prevImportance) ||
                    !isEmptyEqual(difficulty, prevDifficulty)
                );
            })
            .getOrDefault(true);
    }

    private maybeRenderDeleteButton() {
        const { STRINGS } = UnconnectedTaskForm;
        const { task } = this.props;
        if (task != null) {
            return (
                <Button
                    icon={IconNames.TRASH}
                    intent={Intent.DANGER}
                    text={STRINGS.DELETE}
                    onClick={this.deleteTask(task)}
                />
            );
        }
    }

    private deleteTask = (task: EntityWithId<ITask>) => () => {
        const { id: taskId, title } = task;
        this.services.fileService.deleteTask(taskId).then(() => {
            this.services.stateService.showSuccessToast(`Successfully deleted: ${title}`);
            this.props.onDeleteTask();
        });
    };

    private saveTask = () => {
        const { title, assignee, dueDate, description, status, difficulty, importance } = this.state;
        const { projectId, task, currentUser } = this.props;
        const taskId = NullableValue.of(task)
            .map(task => task.id)
            .getOrUndefined();
        const taskProjectId = NullableValue.of(projectId).getOrDefault(currentUser.uid);
        if (!isEmpty(title) && !isEmpty(assignee)) {
            this.services.fileService
                .saveTask(
                    {
                        assignee,
                        description,
                        dueDate,
                        title,
                        status,
                        difficulty,
                        importance,
                        dependencies: [],
                        lastModifiedBy: currentUser.uid,
                        parentProjectId: taskProjectId,
                        type: FileType.TASK,
                        members: [],
                    },
                    taskId,
                )
                .then(newTaskId => {
                    this.services.stateService.showSuccessToast(`Successfully saved: ${title}`);
                    this.props.onSaveTask(newTaskId);
                });
        }
    };

    private onStatusChange = (status: TaskStatus) =>
        this.setState(prevState => {
            if (prevState.status === status) {
                return prevState;
            } else {
                return { ...prevState, status, prevStatus: prevState.status };
            }
        });

    private onClearDifficulty = () => this.onDifficultyChange(null);

    private onDifficultyChange = (difficulty: TaskDifficulty | null) => this.setState({ difficulty });

    private onClearImportance = () => this.onImportanceChange(null);

    private onImportanceChange = (importance: TaskImportance | null) => this.setState({ importance });

    private onTitleChange = (title: string) =>
        this.setState(prevState => {
            if (prevState.title === title) {
                return prevState;
            } else {
                return { ...prevState, title, prevTitle: prevState.title };
            }
        });

    private handleItemSelect = (user: ISearchedUser) => {
        this.services.userService.fetchUsers([user.id]).then(() => {
            this.setAssignee(user.id);
        });
    };

    private onAssigneeClear = () => this.setAssignee("");

    private setAssignee = (userId: string) => {
        this.setState(prevState => {
            if (prevState.assignee === userId) {
                return prevState;
            } else {
                return { ...prevState, assignee: userId, prevAssignee: prevState.assignee, isOmnibarOpen: false };
            }
        });
    };

    private onDueDateChange = (dueDate: Date) => this.setState({ dueDate });

    private onDescriptionChange = (description: string) => this.setState({ description });
}

const mapStateToProps = (appState: IApplicationState): IUserSearchState & IFileState => ({
    ...appState.userSearchState,
    ...appState.fileState,
});

export const TaskForm = connect(mapStateToProps)(UnconnectedTaskForm);
