import React from "react";
import styles from "./projectForm.module.scss";
import { IUserInfo, IUserSearchState, IApplicationState } from "../../../state";
import { handleStringChange } from "../../../common/handleStringChange";
import { ContextType, getServices } from "../../../common/contextProvider";
import { History } from "history";
import {
    FormGroup,
    InputGroup,
    Button,
    Intent,
    TextArea,
    MenuItem,
    Classes,
    Spinner,
    Icon,
    Divider,
    Tooltip,
} from "@blueprintjs/core";
import { IProject, ISearchedUser, FileType } from "../../../api";
import { isEqual, isEmpty, flatten } from "lodash-es";
import { IconNames } from "@blueprintjs/icons";
import { NullableValue } from "../../../common/nullableValue";
import { EntityWithId } from "../../../common/firebase";
import { ItemRenderer, Omnibar, ItemPredicate } from "@blueprintjs/select";
import { highlightText } from "../../../common/highlight";
import { AsyncLoadedValue, IAsyncLoaded } from "../../../common/redoodle";
import { AsyncLoaded } from "../../../common/asyncLoaded";
import { connect } from "react-redux";
import classNames from "classnames";

const UserOmnibar = Omnibar.ofType<ISearchedUser>();
const AsyncLoadedUser = AsyncLoaded.ofType<ISearchedUser, string>();

interface IOwnProps {
    history: History;
    project?: EntityWithId<IProject>;
    currentProject: IAsyncLoaded<EntityWithId<IProject>, string>;
    currentUser: IUserInfo;
    onSaveProject: (projectId: string) => void;
    onDeleteProject: () => void;
}

type IProps = IOwnProps & IUserSearchState;

interface IState {
    isOmnibarOpen: boolean;
    title: string;
    description: string;
    members: string[];
    parentProjectId: string | null;
    prevTitle: string;
    query: string;
}

const DEFAULT_STATE: IState = {
    isOmnibarOpen: false,
    title: "",
    description: "",
    members: [],
    parentProjectId: null,
    prevTitle: "",
    query: "",
};

class UnconnectedProjectForm extends React.PureComponent<IProps, IState> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);
    public state: IState = DEFAULT_STATE;
    private static STRINGS = {
        ADD_MEMBER: "Add member",
        TYPE_TO_SEARCH: "Type to search",
        TITLE_LABEL: "Title",
        STATUS_LABEL: "Status",
        DESCRIPTION_LABEL: "Description",
        MEMBERS_LABEL: "Members",
        TITLE_PLACEHOLDER: "Write a project name",
        DESCRIPTION_PLACEHOLDER: "Write the description",
        REQUIRED: "(required)",
        UPDATE: "Update",
        CREATE: "Create",
        DELETE: "Delete",
        MUST_HAVE_ASSIGNEE: "Assignee must be set",
        MUST_HAVE_TITLE: "Title must be set",
        FAILED_TO_LOAD_USERS: "Failed to load users",
        LOADING_USER: "loading user",
        NO_RESULTS: "No results found",
        DISABLE_DELETE: "You cannot delete your private project",
        MODIFY_PERMISSIONS_AT_ROOT_PROJECT: "Modify permissions at the root project",
    };

    public componentDidMount() {
        this.assignPropsToState(this.props.project);
    }

    public componentDidUpdate(prevProps: IProps) {
        if (!isEqual(prevProps.project, this.props.project)) {
            this.assignPropsToState(this.props.project);
        }
    }

    private assignPropsToState(project?: EntityWithId<IProject>) {
        const { currentProject, currentUser } = this.props;
        if (project == null) {
            if (AsyncLoadedValue.isLoadingSucceeded(currentProject)) {
                const { id: parentProjectId, members: parentMembers } = currentProject.value;
                this.setState({ ...DEFAULT_STATE, members: parentMembers, parentProjectId });
                this.services.userService.fetchUsers(parentMembers);
            } else {
                this.setState({ ...DEFAULT_STATE, members: [currentUser.uid], parentProjectId: null });
                this.services.userService.fetchUsers([currentUser.uid]);
            }
        } else {
            const { title, description, parentProjectId, members } = project;
            this.setState({ title, description, parentProjectId, members });
            this.services.userService.fetchUsers(members);
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
        const { project, currentUser } = this.props;
        const { title, description } = this.state;
        const { STRINGS } = UnconnectedProjectForm;
        const titleHelperText = this.getTitleHelperText();
        const isDisabled = project != null && project.id === currentUser.uid;
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
                        disabled={isDisabled}
                        id="title-input"
                        placeholder={STRINGS.TITLE_PLACEHOLDER}
                        value={title}
                        onChange={handleStringChange(this.onTitleChange)}
                    />
                </FormGroup>
                <FormGroup label={STRINGS.DESCRIPTION_LABEL} labelFor="description-input">
                    <TextArea
                        disabled={isDisabled}
                        className={styles.projectDescription}
                        id="description-input"
                        growVertically={false}
                        placeholder={STRINGS.DESCRIPTION_PLACEHOLDER}
                        onChange={handleStringChange(this.onDescriptionChange)}
                        value={description}
                    />
                </FormGroup>
                {this.renderMemberFormGroup()}
            </div>
        );
    }

    private renderMemberFormGroup() {
        const { STRINGS } = UnconnectedProjectForm;
        const { searchedUsers } = this.props;
        const userInfos = AsyncLoadedValue.isReady(searchedUsers) ? searchedUsers.value : [];
        return (
            <FormGroup label={STRINGS.MEMBERS_LABEL} labelFor="members-input">
                {this.renderSelectedMembers()}
                <UserOmnibar
                    itemPredicate={this.filterUsers}
                    itemRenderer={this.renderUser}
                    isOpen={this.state.isOmnibarOpen}
                    noResults={<MenuItem disabled={true} text={this.renderNoResultsReason()} />}
                    onItemSelect={this.handleItemSelect}
                    items={userInfos}
                    onClose={this.onOmnibarClose}
                    onQueryChange={this.onQueryChange}
                    query={this.state.query}
                />
            </FormGroup>
        );
    }

    private renderNoResultsReason() {
        const { searchedUsers } = this.props;
        const { STRINGS } = UnconnectedProjectForm;
        return AsyncLoadedValue.isLoading(searchedUsers) || AsyncLoadedValue.isReloading(searchedUsers) ? (
            <Spinner />
        ) : (
            STRINGS.NO_RESULTS
        );
    }

    private onQueryChange = (query: string) => {
        this.setState({ query }, () => {
            this.services.userService.searchUsers(query);
        });
    };

    private filterUsers: ItemPredicate<ISearchedUser> = (query, user, _index) => {
        const { displayName, email, id } = user;
        const normalizedDisplay = displayName ? displayName.toLowerCase() : "";
        const normalizedEmail = email ? email.toLowerCase() : "";
        const normalizedQuery = query.toLowerCase();
        return `${normalizedDisplay} ${normalizedEmail} ${id}`.indexOf(normalizedQuery) >= 0;
    };

    private renderSelectedMembers() {
        const { STRINGS } = UnconnectedProjectForm;
        const { fetchedUsers, project, currentUser } = this.props;
        const isDisabled = (project != null && project.id === currentUser.uid) || this.state.parentProjectId != null;
        return (
            <>
                <div className={classNames(Classes.INPUT, styles.memberInput)}>
                    {this.state.members.map((member, idx) => {
                        return flatten(
                            NullableValue.of(fetchedUsers.get(member))
                                .map<Array<JSX.Element | null>>(user => {
                                    return [
                                        <AsyncLoadedUser
                                            key={member}
                                            asyncLoadedValue={user}
                                            renderLoaded={this.renderLoadedUser}
                                            renderLoading={() => (
                                                <div className={Classes.SKELETON}>{STRINGS.LOADING_USER}</div>
                                            )}
                                        />,
                                        idx + 1 !== this.state.members.length ? (
                                            <Divider key={`${member}-key`} />
                                        ) : null,
                                    ];
                                })
                                .getOrDefault([]),
                        );
                    })}
                </div>
                <Button
                    disabled={isDisabled}
                    onClick={this.onOmnibarOpen}
                    text={STRINGS.ADD_MEMBER}
                    intent={Intent.PRIMARY}
                    minimal={true}
                    fill={true}
                />
            </>
        );
    }

    private renderLoadedUser = (searchedUser: ISearchedUser) => {
        const { id, displayName, email } = searchedUser;
        const userEmail = NullableValue.of(email);
        const text = displayName == null ? userEmail.getOrDefault("") : displayName;
        const label = displayName == null ? undefined : userEmail.getOrUndefined();
        return (
            <div className={styles.projectMember}>
                <div className={styles.projectMemberMetadata}>
                    {this.renderMemberActionIcon(id)}
                    <div>{text}</div>
                </div>
                <div className={Classes.MENU_ITEM_LABEL}>{label}</div>
            </div>
        );
    };

    private renderMemberActionIcon(userId: string) {
        const { currentUser, project } = this.props;
        const { uid } = currentUser;
        const { STRINGS } = UnconnectedProjectForm;
        const isDisabled = project != null && project.parentProjectId != null;
        const tooltipContent = isDisabled ? STRINGS.MODIFY_PERMISSIONS_AT_ROOT_PROJECT : undefined;
        if (userId !== uid) {
            return (
                <Tooltip content={tooltipContent}>
                    <Button
                        minimal={true}
                        disabled={isDisabled}
                        icon={IconNames.CROSS}
                        onClick={this.removeMember(userId)}
                    />
                </Tooltip>
            );
        } else {
            return (
                <div className={styles.yourself}>
                    <Icon className={styles.youIcon} icon={IconNames.PERSON} />
                </div>
            );
        }
    }

    private removeMember = (userId: string) => () => {
        const { uid } = this.props.currentUser;
        if (userId !== uid) {
            this.setState(prevState => ({
                ...prevState,
                members: prevState.members.filter(member => member !== userId),
                isOmnibarOpen: false,
            }));
        }
    };

    private onOmnibarOpen = () => this.setState({ isOmnibarOpen: true });

    private onOmnibarClose = () => this.setState({ isOmnibarOpen: false });

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

    private handleItemSelect = (user: ISearchedUser) => {
        this.services.userService.fetchUsers([user.id]);
        this.setState(prevState => ({
            ...prevState,
            members: [...prevState.members, user.id],
            isOmnibarOpen: false,
            query: "",
        }));
    };

    private getTitleHelperText() {
        const { title, prevTitle } = this.state;
        const { STRINGS } = UnconnectedProjectForm;
        if (isEmpty(title) && !isEmpty(prevTitle)) {
            return STRINGS.MUST_HAVE_TITLE;
        }
    }

    private renderFormActions() {
        const { STRINGS } = UnconnectedProjectForm;
        const saveButtonText = this.props.project == null ? STRINGS.CREATE : STRINGS.UPDATE;
        return (
            <div className={styles.actions}>
                {this.maybeRenderDeleteButton()}
                <Button
                    disabled={this.isSaveDisabled()}
                    icon={IconNames.FLOPPY_DISK}
                    intent={Intent.SUCCESS}
                    text={saveButtonText}
                    onClick={this.saveProject}
                />
            </div>
        );
    }

    private isSaveDisabled() {
        const { members, title } = this.state;
        const { project, currentUser } = this.props;
        return isEmpty(members) || isEmpty(title) || (project != null && project.id === currentUser.uid);
    }

    private maybeRenderDeleteButton() {
        const { STRINGS } = UnconnectedProjectForm;
        const { project, currentUser } = this.props;
        if (project != null) {
            const tooltipContent = project.id === currentUser.uid ? STRINGS.DISABLE_DELETE : undefined;
            return (
                <Tooltip content={tooltipContent}>
                    <Button
                        disabled={tooltipContent != null}
                        icon={IconNames.TRASH}
                        intent={Intent.DANGER}
                        text={STRINGS.DELETE}
                        onClick={this.deleteProject(project)}
                    />
                </Tooltip>
            );
        }
    }

    private deleteProject = (project: EntityWithId<IProject>) => () => {
        const { id: projectId, title } = project;
        this.services.fileService.deleteProject(projectId).then(() => {
            this.services.stateService.showSuccessToast(`Successfully deleted project: ${title}`);
            this.props.onDeleteProject();
        });
    };

    private saveProject = () => {
        const { title, description, members, parentProjectId } = this.state;
        const projectId = NullableValue.of(this.props.project)
            .map(project => project.id)
            .getOrUndefined();
        if (!isEmpty(title) && !isEmpty(members)) {
            this.services.fileService
                .saveProject(
                    {
                        title,
                        description,
                        members,
                        parentProjectId,
                        type: FileType.PROJECT,
                    },
                    projectId,
                )
                .then(newProjectId => {
                    this.services.stateService.showSuccessToast(`Successfully saved: ${title}`);
                    this.props.onSaveProject(newProjectId);
                });
        }
    };

    private onTitleChange = (title: string) =>
        this.setState(prevState => {
            if (prevState.title === title) {
                return prevState;
            } else {
                return { ...prevState, title, prevTitle: prevState.title };
            }
        });

    private onDescriptionChange = (description: string) => this.setState({ description });
}

const mapStateToProps = (appState: IApplicationState): IUserSearchState => ({
    ...appState.userSearchState,
});

export const ProjectForm = connect(mapStateToProps)(UnconnectedProjectForm);
