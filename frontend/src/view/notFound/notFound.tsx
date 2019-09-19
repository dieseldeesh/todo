import React from "react";
import { NonIdealState, Button, Intent, Card, Elevation } from "@blueprintjs/core";
import { PathLink } from "../../common/navigationWithPath";
import { IconNames } from "@blueprintjs/icons";
import styles from "./notFound.module.scss";
import { TaskPath } from "../../paths";

export class NotFound extends React.PureComponent {
    private static STRINGS = {
        TITLE: "Page not found",
        ACTION: "Back to home",
    };

    public render() {
        const { STRINGS } = NotFound;
        return (
            <div className={styles.notFoundPage}>
                <div className={styles.pageContentWrapper}>
                    <Card elevation={Elevation.THREE} className={styles.pageContent}>
                        <NonIdealState title={STRINGS.TITLE} icon={IconNames.ERROR} action={this.renderBackToHome()} />
                    </Card>
                </div>
            </div>
        );
    }

    private renderBackToHome() {
        const { STRINGS } = NotFound;
        return (
            <PathLink className={styles.listButton} to={new TaskPath({})}>
                <Button intent={Intent.PRIMARY} text={STRINGS.ACTION} />
            </PathLink>
        );
    }
}
