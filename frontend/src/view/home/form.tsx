import React from "react";
import styles from "./form.module.scss";
import { AppAction, TaskStatus } from "../../state/types";
import { handleStringChange } from "../../common/handleStringChange";
import { ContextType, getServices } from "../../common/contextProvider";
import { DatePicker } from "@blueprintjs/datetime";
import { History } from "history";
import { FormGroup, InputGroup, Button, Intent, TextArea, MenuItem, Text, Popover } from "@blueprintjs/core";
import { ITaskWithId } from "../../api";
import { isEqual, isEmpty } from "lodash-es";
import { IconNames } from "@blueprintjs/icons";
import { NullableValue } from "../../common/nullableValue";
import { ListPath } from "../../paths";
import { EditPath } from "../../paths/edit";
import { Select, ItemRenderer } from "@blueprintjs/select";
import { highlightText } from "../../common/highlight";
import moment from "moment";
import { TaskStatusIcon } from "./taskStatusIcon";
import { DATE_TIME_FORMAT } from "../../common/dateTimeFormat";

interface IProps {
    history: History;
    action: AppAction;
    task?: ITaskWithId;
}

interface IState {
    title: string;
    author: string;
    prevTitle: string;
    prevAuthor: string;
    prevStatus: TaskStatus;
    dueDate: Date;
    description: string;
    status: TaskStatus;
}

const DEFAULT_STATE: IState = {
    title: "",
    author: "",
    dueDate: new Date(),
    description: "",
    prevTitle: "",
    prevAuthor: "",
    prevStatus: TaskStatus.NOT_STARTED,
    status: TaskStatus.NOT_STARTED,
};

const TaskStatusSelect = Select.ofType<TaskStatus>();

const TASK_STATUS_STYLES: Record<TaskStatus, true> = {
    [TaskStatus.NOT_STARTED]: true,
    [TaskStatus.IN_PROGRESS]: true,
    [TaskStatus.BLOCKED]: true,
    [TaskStatus.COMPLETED]: true,
};

const TASK_STATUSES = Object.keys(TASK_STATUS_STYLES) as TaskStatus[];

export default class Form extends React.PureComponent<IProps, IState> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);
    public state: IState = DEFAULT_STATE;
    private static STRINGS = {
        NO_TASKS: "No tasks found",
        TITLE_LABEL: "Title",
        STATUS_LABEL: "Status",
        AUTHOR_LABEL: "Assignee",
        DUE_DATE_LABEL: "Due date",
        DESCRIPTION_LABEL: "Description",
        TITLE_PLACEHOLDER: "Write a task name",
        AUTHOR_PLACEHOLDER: "Write the author name",
        DESCRIPTION_PLACEHOLDER: "Write the description",
        REQUIRED: "(required)",
        UPDATE: "Update",
        CREATE: "Create",
        DELETE: "Delete",
        MUST_HAVE_AUTHOR: "Author must be set",
        MUST_HAVE_TITLE: "Title must be set",
    };

    public componentDidMount() {
        this.assignPropsToState(this.props.task);
    }

    public componentDidUpdate(prevProps: IProps) {
        if (!isEqual(prevProps.task, this.props.task)) {
            this.assignPropsToState(this.props.task);
        }
    }

    private assignPropsToState(task?: ITaskWithId) {
        if (task == null) {
            this.setState(DEFAULT_STATE);
        } else {
            const { author, description, dueDate, title, status } = task;
            this.setState({ title, author, dueDate, description, status });
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
        const { author, description, dueDate, title } = this.state;
        const { STRINGS } = Form;
        const titleHelperText = this.getTitleHelperText();
        const authorHelperText = this.getAuthorHelperText();
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
                {this.maybeRenderTaskStatusInput()}
                <FormGroup
                    intent={isEmpty(authorHelperText) ? Intent.NONE : Intent.DANGER}
                    helperText={authorHelperText}
                    label={STRINGS.AUTHOR_LABEL}
                    labelFor="author-input"
                    labelInfo={STRINGS.REQUIRED}
                >
                    <InputGroup
                        id="author-input"
                        placeholder={STRINGS.AUTHOR_PLACEHOLDER}
                        value={author}
                        onChange={handleStringChange(this.onAuthorChange)}
                    />
                </FormGroup>
                <FormGroup label={STRINGS.DUE_DATE_LABEL} labelFor="due-input">
                    <Popover targetClassName={styles.dateInputPopoverTarget}>
                        <Button className={styles.dateInput} text={moment(dueDate).format(DATE_TIME_FORMAT)} />
                        <DatePicker
                            minDate={new Date()}
                            onChange={this.onDueDateChange}
                            value={dueDate}
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

    private maybeRenderTaskStatusInput() {
        const { STRINGS } = Form;
        const { status } = this.state;
        if (this.props.task != null) {
            return (
                <FormGroup label={STRINGS.STATUS_LABEL} labelFor="status-input" labelInfo={STRINGS.REQUIRED}>
                    <TaskStatusSelect
                        items={TASK_STATUSES}
                        itemRenderer={this.renderTaskStatus}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        onItemSelect={this.onStatusChange}
                    >
                        <Button
                            text={this.renderTaskStatusMenuItemContent(status)}
                            rightIcon={IconNames.DOUBLE_CARET_VERTICAL}
                        />
                    </TaskStatusSelect>
                </FormGroup>
            );
        }
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

    private renderTaskStatusMenuItemContent(status: TaskStatus, query: string = "") {
        return (
            <div className={styles.taskStatus}>
                <TaskStatusIcon status={status} />
                <Text>{highlightText(this.formatStatus(status), query)}</Text>
            </div>
        );
    }

    private formatStatus(status: TaskStatus) {
        return status.split("_").join(" ");
    }

    private getTitleHelperText() {
        const { title, prevTitle } = this.state;
        const { STRINGS } = Form;
        if (isEmpty(title) && !isEmpty(prevTitle)) {
            return STRINGS.MUST_HAVE_TITLE;
        }
    }

    private getAuthorHelperText() {
        const { author, prevAuthor } = this.state;
        const { STRINGS } = Form;
        if (isEmpty(author) && !isEmpty(prevAuthor)) {
            return STRINGS.MUST_HAVE_AUTHOR;
        }
    }

    private renderFormActions() {
        const { STRINGS } = Form;
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
        const { author, title } = this.state;
        return isEmpty(author) || isEmpty(title);
    }

    private maybeRenderDeleteButton() {
        const { STRINGS } = Form;
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

    private deleteTask = (task: ITaskWithId) => () => {
        const { author, id: taskId, title } = task;
        this.services.taskService.deleteTask(taskId).then(() => {
            this.services.stateService.showSuccessToast(`Successfully deleted ${title} by ${author}`);
            this.props.history.push(new ListPath().getLocationDescriptor());
        });
    };

    private saveTask = () => {
        const { title, author, dueDate, description, status } = this.state;
        const taskId = NullableValue.of(this.props.task)
            .map(task => task.id)
            .getOrUndefined();
        if (!isEmpty(title) && !isEmpty(author)) {
            this.services.taskService
                .saveTask({ author, description, dueDate, title, status }, taskId)
                .then(newTaskId => {
                    this.services.stateService.showSuccessToast(`Successfully saved ${title} by ${author}`);
                    this.props.history.push(new EditPath({ taskId: newTaskId }).getLocationDescriptor());
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

    private onTitleChange = (title: string) =>
        this.setState(prevState => {
            if (prevState.title === title) {
                return prevState;
            } else {
                return { ...prevState, title, prevTitle: prevState.title };
            }
        });

    private onAuthorChange = (author: string) =>
        this.setState(prevState => {
            if (prevState.author === author) {
                return prevState;
            } else {
                return { ...prevState, author, prevAuthor: prevState.author };
            }
        });

    private onDueDateChange = (dueDate: Date) => this.setState({ dueDate });

    private onDescriptionChange = (description: string) => this.setState({ description });
}
