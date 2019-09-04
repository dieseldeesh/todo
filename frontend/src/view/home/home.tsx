import React from "react";
import { Card, Elevation, Button } from "@blueprintjs/core";
import styles from "./home.module.scss";
import { IApplicationState, ITaskState, AppAction } from "../../state/types";
import { connect } from "react-redux";
import { ContextType, getServices } from "../../common/contextProvider";
import { History } from "history";
import ListTasks from "./listTasks";
import Form from "./form";
import { ITaskWithId } from "../../api/task";
import { AsyncLoadedValue } from "../../common/redoodle";
import { IconNames } from "@blueprintjs/icons";
import { PathLink } from "../../common/navigationWithPath";
import { ListPath } from "../../paths/list";
import classNames from "classnames";
import { isEqual } from "lodash-es";
import { Slide } from "../../styles/transition";

interface IOwnProps extends IStateProps {
    history: History;
    taskId?: string;
}

interface IViewOwnProps extends IOwnProps {
    action: AppAction.LIST_TASKS | AppAction.ADD_TASK;
    taskId: undefined;
}

interface IEditOwnProps extends IOwnProps {
    action: AppAction.EDIT_TASK;
    taskId: string;
}

interface IStateProps extends ITaskState {}

type IHomeProps = IViewOwnProps | IEditOwnProps;

class UnconnectedHome extends React.PureComponent<IHomeProps> {
    public static contextTypes = ContextType;
    private static STRINGS = {
        TITLE: "Tasks",
        CREATE: "Create new task",
        EDIT: "Update task",
    };
    private services = getServices(this.context);

    public componentDidMount() {
        const { STRINGS } = UnconnectedHome;
        const { stateService, taskService } = this.services;
        this.props.showIncompletedTasks ? taskService.listIncompleteTasks() : taskService.listCompletedTasks();
        if (this.props.action === AppAction.EDIT_TASK) {
            taskService.getTask(this.props.taskId);
        }
        stateService.setDocumentTitle(STRINGS.TITLE);
    }

    public componentDidUpdate(prevProps: IHomeProps) {
        if (this.props.action === AppAction.EDIT_TASK) {
            const { taskId } = this.props;
            if (prevProps.action !== AppAction.EDIT_TASK || !isEqual(taskId, prevProps.taskId)) {
                this.services.taskService.getTask(taskId);
            }
        }
    }

    public render() {
        const listStyles = classNames(styles.tasksView, this.shouldRenderForm() ? styles.shrink : styles.stretch);
        return (
            <div className={styles.home}>
                <div className={styles.content}>
                    <Card elevation={Elevation.THREE} className={listStyles}>
                        <ListTasks {...this.props} />
                    </Card>
                    {this.maybeRenderForm()}
                </div>
            </div>
        );
    }

    private maybeRenderForm() {
        if (this.props.action === AppAction.ADD_TASK) {
            return this.renderForm(true);
        } else if (
            this.props.action === AppAction.EDIT_TASK &&
            AsyncLoadedValue.isLoadingSucceeded(this.props.currentTask)
        ) {
            const { currentTask } = this.props;
            return this.renderForm(true, currentTask.value);
        }
        return this.renderForm(false);
    }

    private shouldRenderForm() {
        return (
            this.props.action === AppAction.ADD_TASK ||
            (this.props.action === AppAction.EDIT_TASK && AsyncLoadedValue.isLoadingSucceeded(this.props.tasksWithId))
        );
    }

    private renderForm = (show: boolean, task?: ITaskWithId) => {
        const { STRINGS } = UnconnectedHome;
        return (
            <Slide show={show}>
                <Card elevation={Elevation.THREE} className={classNames(styles.formView)}>
                    <div className={styles.formHeader}>
                        <h2>{task == null ? STRINGS.CREATE : STRINGS.EDIT}</h2>
                        <PathLink to={new ListPath()}>
                            <Button minimal={true} icon={IconNames.CROSS} />
                        </PathLink>
                    </div>
                    <Form {...this.props} task={task} />
                </Card>
            </Slide>
        );
    };
}

const mapStateToProps = (appState: IApplicationState): IStateProps => ({ ...appState.taskState });

export const Home = connect(mapStateToProps)(UnconnectedHome);
