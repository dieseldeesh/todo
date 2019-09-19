import React from "react";
import { IUserInfo } from "../../state";
import styles from "./userIcon.module.scss";
import { Icon } from "@blueprintjs/core";
import { NullableValue } from "../../common/nullableValue";
import { IconNames } from "@blueprintjs/icons";

interface IProps {
    currentUser: IUserInfo;
    currentUserPhotoURL: string | null;
}

export class UserIcon extends React.PureComponent<IProps> {
    public render() {
        const { currentUser } = this.props;
        const displayText = currentUser.displayName
            ? currentUser.displayName
            : NullableValue.of(currentUser.email).getOrDefault("");
        const { currentUserPhotoURL } = this.props;
        if (currentUserPhotoURL != null) {
            return <img className={styles.profilePicture} src={currentUserPhotoURL} alt={displayText} />;
        } else {
            return <Icon icon={IconNames.USER} />;
        }
    }
}
