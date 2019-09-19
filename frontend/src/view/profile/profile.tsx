import React from "react";
import {
    Card,
    Elevation,
    H2,
    FormGroup,
    InputGroup,
    Intent,
    Button,
    Dialog,
    Classes,
    Tooltip,
    Icon,
} from "@blueprintjs/core";
import styles from "./profile.module.scss";
import { IUserInfo, AppView } from "../../state";
import { ContextType, getServices } from "../../common/contextProvider";
import { Navigation } from "../../components/navigation/navigation";
import { History } from "history";
import { isEqual, isEmpty } from "lodash-es";
import { handleStringChange, handleFileChange } from "../../common/handleStringChange";
import { IconNames } from "@blueprintjs/icons";
import { isEmptyEqual } from "../../common/isEmptyEqual";
import ReactCrop, { Crop } from "react-image-crop";
import { ICropMetadata } from "../../api/photo";
import classNames from "classnames";

interface IProps {
    history: History;
    currentUser: IUserInfo;
    currentUserPhotoURL: string | null;
}

interface IState {
    displayName: string;
    email: string;
    photoURL: string;
    photo: File | null;
    isPhotoCropDialogOpen: boolean;
    deleteProfile: boolean;
    crop: ICropMetadata | undefined;
    prevPhotoURL: string;
}

const DEFAULT_STATE: IState = {
    displayName: "",
    email: "",
    photoURL: "",
    photo: null,
    deleteProfile: false,
    crop: undefined,
    isPhotoCropDialogOpen: false,
    prevPhotoURL: "",
};

export class Profile extends React.PureComponent<IProps, IState> {
    public static contextTypes = ContextType;
    private static STRINGS = {
        TITLE: "User profile",
        DISPLAY_NAME_LABEL: "Display name",
        EMAIL_LABEL: "Email address",
        PHOTO_LABEL: "Display photo",
        DISPLAY_NAME_PLACEHOLDER: "Larry Page",
        EMAIL_PLACEHOLDER: "larry@google.com",
        PHOTO_URL_PLACEHOLDER: "https://photos.google.com/abc123",
        SAVE: "Save",
        DELETE: "Delete account",
        DELETE_CONFIRM: "Delete",
        DELETE_WARNING: "Are you sure you want to delete your account?",
        CANCEL: "Cancel",
        ACCOUNT_DETAILS_HAVE_NOT_CHANGED: "Account details have not changed",
        CHOOSE_PHOTO: "Choose photo",
        PLEASE_CHOOSE_AN_IMAGE: "Selected file was not an image. Please choose an image.",
        CROP_PHOTO: "Crop photo",
        CONFIRM_CROP: "Confirm crop",
    };
    private services = getServices(this.context);
    public state: IState = DEFAULT_STATE;

    public componentDidMount() {
        const { currentUser, currentUserPhotoURL } = this.props;
        this.copyUserInfoToState(currentUser, currentUserPhotoURL);
    }

    public componentDidUpdate(prevProps: IProps) {
        const { currentUser, currentUserPhotoURL } = this.props;
        if (
            !isEqual(currentUser, prevProps.currentUser) ||
            !isEqual(currentUserPhotoURL, prevProps.currentUserPhotoURL)
        ) {
            this.copyUserInfoToState(currentUser, currentUserPhotoURL);
        }
    }

    public render() {
        const { STRINGS } = Profile;
        const { currentUserPhotoURL, currentUser, history } = this.props;
        return (
            <div className={styles.home}>
                <Navigation
                    history={history}
                    taskId={undefined}
                    appView={AppView.PROFILE}
                    currentUser={currentUser}
                    currentUserPhotoURL={currentUserPhotoURL}
                />
                <div className={styles.body}>
                    <div className={styles.content}>
                        <Card elevation={Elevation.THREE} className={styles.tasksView}>
                            <H2>{STRINGS.TITLE}</H2>
                            {this.renderForm()}
                        </Card>
                    </div>
                </div>
                <Dialog
                    icon={IconNames.TRASH}
                    onClose={this.onCancelDelete}
                    title={STRINGS.DELETE}
                    isOpen={this.state.deleteProfile}
                >
                    <div className={Classes.DIALOG_BODY}>
                        <p>{STRINGS.DELETE_WARNING}</p>
                    </div>
                    <div className={Classes.DIALOG_FOOTER}>
                        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                            <Button onClick={this.onCancelDelete}>{STRINGS.CANCEL}</Button>
                            <Button onClick={this.onConfirmDelete} intent={Intent.DANGER}>
                                {STRINGS.DELETE_CONFIRM}
                            </Button>
                        </div>
                    </div>
                </Dialog>
                {this.renderPhotoCropDialog()}
            </div>
        );
    }

    private renderPhotoCropDialog() {
        const { STRINGS } = Profile;
        const { photoURL, crop, isPhotoCropDialogOpen } = this.state;
        return (
            <Dialog
                className={styles.resizer}
                icon={IconNames.MEDIA}
                onClose={this.onCancelImageSelection}
                title={STRINGS.CROP_PHOTO}
                isOpen={isPhotoCropDialogOpen}
            >
                <div className={classNames(Classes.DIALOG_BODY, styles.cropDialogBody)}>
                    <ReactCrop
                        src={photoURL}
                        crop={crop}
                        imageStyle={{
                            maxHeight: 500,
                            maxWidth: 500,
                        }}
                        onChange={this.onUpdateCrop}
                        circularCrop={true}
                    />
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={this.onCancelImageSelection}>{STRINGS.CANCEL}</Button>
                        <Button onClick={this.onConfirmResize} intent={Intent.PRIMARY}>
                            {STRINGS.CONFIRM_CROP}
                        </Button>
                    </div>
                </div>
            </Dialog>
        );
    }

    private onCancelImageSelection = () =>
        this.setState(prevState => ({
            ...prevState,
            isPhotoCropDialogOpen: false,
            photoURL: prevState.prevPhotoURL,
            prevPhotoURL: "",
        }));

    private onConfirmResize = () => {
        this.setState(
            prevState => ({
                ...prevState,
                isPhotoCropDialogOpen: false,
                prevPhotoURL: prevState.photoURL,
            }),
            () => {
                const { photoURL, crop } = this.state;
                if (!isEmpty(photoURL) && crop != null) {
                    this.getCroppedImg(crop);
                }
            },
        );
    };

    private copyUserInfoToState(currentUser: IUserInfo, photoURL: string | null) {
        const { displayName, email } = currentUser;
        this.setState({
            displayName: displayName || "",
            email: email || "",
            photoURL: photoURL || "",
            prevPhotoURL: photoURL || "",
            crop: undefined,
        });
    }

    private renderForm() {
        const { STRINGS } = Profile;
        return (
            <>
                <div className={styles.formWrapper}>
                    <div className={styles.photoCanvas}>
                        {this.maybeRenderProfilePicture()}
                        <div className={styles.editPhoto} onClick={this.onEditProfilePicture}>
                            <Icon icon={IconNames.EDIT} iconSize={Icon.SIZE_LARGE} />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref="fileInput"
                        id="photo-url-input"
                        className={styles.fileInput}
                        onChange={handleFileChange(this.onPhotoURLChange)}
                    />
                    <div className={styles.textInputs}>
                        {this.renderDisplayName()}
                        {this.renderEmail()}
                    </div>
                </div>
                <div className={styles.actions}>
                    <Button intent={Intent.DANGER} onClick={this.onDelete} text={STRINGS.DELETE} />
                    <Tooltip content={this.haveValuesChanged() ? undefined : STRINGS.ACCOUNT_DETAILS_HAVE_NOT_CHANGED}>
                        <Button
                            intent={Intent.SUCCESS}
                            onClick={this.onSave}
                            disabled={!this.haveValuesChanged()}
                            text={STRINGS.SAVE}
                        />
                    </Tooltip>
                </div>
            </>
        );
    }

    private renderDisplayName() {
        const { STRINGS } = Profile;
        const { displayName } = this.state;
        return (
            <FormGroup label={STRINGS.DISPLAY_NAME_LABEL} labelFor="display-name-input">
                <InputGroup
                    id="display-name-input"
                    placeholder={STRINGS.DISPLAY_NAME_PLACEHOLDER}
                    value={displayName}
                    onChange={handleStringChange(this.onDisplayNameChange)}
                />
            </FormGroup>
        );
    }

    private renderEmail() {
        const { STRINGS } = Profile;
        const { email } = this.state;
        return (
            <FormGroup label={STRINGS.EMAIL_LABEL} labelFor="email-input">
                <InputGroup
                    id="email-input"
                    placeholder={STRINGS.EMAIL_PLACEHOLDER}
                    value={email}
                    onChange={handleStringChange(this.onEmailChange)}
                />
            </FormGroup>
        );
    }

    private maybeRenderProfilePicture() {
        const { STRINGS } = Profile;
        const { photoURL, crop } = this.state;
        const { currentUserPhotoURL } = this.props;
        const length = photoURL.length > 0 && crop != null ? 100 : 0;
        const photoStyles =
            (photoURL.length > 0 && crop != null) || currentUserPhotoURL == null
                ? styles.hidePhotoImg
                : styles.photoImg;
        if (photoURL.length > 0) {
            return (
                <>
                    <img ref="image" src={photoURL} alt={STRINGS.PHOTO_LABEL} className={photoStyles} />
                    <canvas ref="canvas" height={length} width={length} />
                </>
            );
        } else {
            return <Icon className={styles.photoCanvas} icon={IconNames.USER} iconSize={100} />;
        }
    }

    private onEditProfilePicture = () => {
        const fileInput = this.refs.fileInput as HTMLInputElement;
        fileInput.click();
    };

    private onUpdateCrop = (crop: Crop) => {
        const cropMetadata = crop as ICropMetadata;
        const { x, y, width, height } = cropMetadata;
        this.setState({
            crop: {
                ...cropMetadata,
                x: Math.round(x),
                y: Math.round(y),
                width: Math.round(width),
                height: Math.round(height),
                aspect: 1,
            },
        });
    };

    private onDisplayNameChange = (displayName: string) => this.setState({ displayName });

    private onEmailChange = (email: string) => this.setState({ email });

    private onPhotoURLChange = (files: FileList | null) => {
        const { STRINGS } = Profile;
        if (files != null && files.length > 0) {
            const fileReader = new FileReader();
            const file = files[0];
            fileReader.onload = () => {
                if (typeof fileReader.result === "string") {
                    const photoURL: string = fileReader.result;
                    this.setState(prevState => ({
                        ...prevState,
                        photoURL,
                        photo: file,
                        prevPhotoURL: prevState.photoURL,
                        isPhotoCropDialogOpen: true,
                    }));
                }
            };

            if (file.type.split("/")[0] === "image") {
                fileReader.readAsDataURL(file);
            } else {
                this.services.stateService.showFailToast(STRINGS.PLEASE_CHOOSE_AN_IMAGE);
            }
        }
    };

    private haveValuesChanged = () => {
        const { displayName, email, photoURL } = this.state;
        const { displayName: prevDisplayName, email: prevEmail, photoURL: prevPhotoURL } = this.props.currentUser;
        return (
            !isEmpty(email) &&
            (!isEmptyEqual(displayName, prevDisplayName) ||
                !isEmptyEqual(email, prevEmail) ||
                !isEmptyEqual(photoURL, prevPhotoURL))
        );
    };

    private onSave = () => {
        const { userService, stateService, fileService } = this.services;
        const { displayName, photo, email, crop } = this.state;
        if (this.haveValuesChanged() && photo != null && crop != null) {
            fileService.uploadPhoto(photo, crop).then(() => {
                userService.updateCurrentUser({ displayName, email }).then(() => {
                    stateService.showSuccessToast("Successfully saved profile");
                });
            });
        }
    };

    private onDelete = () => {
        this.setState({ deleteProfile: true });
    };

    private onCancelDelete = () => {
        this.setState({ deleteProfile: false });
    };

    private onConfirmDelete = () => {
        this.services.userService.deleteCurrentUser();
    };

    private getCroppedImg(crop: ICropMetadata) {
        const canvas = this.refs.canvas as HTMLCanvasElement;
        const image = this.refs.image as HTMLImageElement;
        const height = Math.min((image.naturalHeight * 500) / image.naturalWidth, 500);
        const width = Math.min((image.naturalWidth * 500) / image.naturalHeight, 500);
        const scaleX = image.naturalWidth / width;
        const scaleY = image.naturalHeight / height;
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext("2d");
        if (ctx != null) {
            ctx.beginPath();
            ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                100,
                100,
            );
        }
        this.setState({ crop: { ...crop, naturalHeight: image.naturalHeight, naturalWidth: image.naturalWidth } });
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                blob => {
                    if (blob == null) {
                        reject("Error loading image");
                    } else {
                        resolve(blob);
                    }
                },
                "image/jpeg",
                1,
            );
        });
    }
}
