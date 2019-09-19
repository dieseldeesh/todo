import React from "react";
import { Card, Elevation, Collapse, Intent, Button } from "@blueprintjs/core";
import styles from "./auth.module.scss";
import { SignIn } from "./signIn";
import { History } from "history";
import { SignUp } from "./signUp";
import classNames from "classnames";
import { PathRedirect } from "../../common/navigationWithPath";
import { TaskPath } from "../../paths";
import { Redirect } from "react-router";
import { NullableValue } from "../../common/nullableValue";

interface IProps {
    history: History;
    loggedIn: boolean;
}

enum Authentication {
    SIGN_IN,
    SIGN_UP,
}

interface IState {
    authentication: Authentication;
}

export class Auth extends React.PureComponent<IProps, IState> {
    public state: IState = { authentication: Authentication.SIGN_IN };
    private static STRINGS = {
        TITLE: "Sign in",
        ALREADY_HAVE_AN_ACCOUNT: "Already have an account?",
        DONT_HAVE_AN_ACCOUNT: "Don't have an account?",
        CREATE_AN_ACCOUNT: "Create one!",
        SIGN_IN: "Sign in!",
    };

    public render() {
        const { loggedIn, history } = this.props;
        if (loggedIn) {
            const from = NullableValue.of(history.location.state)
                .map(state => state.from)
                .getOrUndefined();
            return from == null ? <PathRedirect to={new TaskPath({})} /> : <Redirect to={from} />;
        }
        const { authentication } = this.state;
        const { STRINGS } = Auth;
        const isSignInOpen = authentication === Authentication.SIGN_IN;
        const isSignUpOpen = authentication === Authentication.SIGN_UP;
        return (
            <div className={styles.authPage}>
                <div className={styles.pageContentWrapper}>
                    <Card elevation={Elevation.THREE} className={styles.pageContent}>
                        <Collapse
                            className={classNames({ [styles.fadeCollapse]: isSignUpOpen })}
                            transitionDuration={400}
                            isOpen={isSignInOpen}
                        >
                            <SignIn />
                            <div className={styles.authenticationToggle}>
                                {STRINGS.DONT_HAVE_AN_ACCOUNT}
                                <Button
                                    onClick={this.setAuthentication(Authentication.SIGN_UP)}
                                    text={STRINGS.CREATE_AN_ACCOUNT}
                                    minimal={true}
                                    intent={Intent.PRIMARY}
                                />
                            </div>
                        </Collapse>
                        <Collapse
                            className={classNames({ [styles.fadeCollapse]: isSignInOpen })}
                            transitionDuration={400}
                            isOpen={isSignUpOpen}
                        >
                            <SignUp />
                            <div className={styles.authenticationToggle}>
                                {STRINGS.ALREADY_HAVE_AN_ACCOUNT}
                                <Button
                                    onClick={this.setAuthentication(Authentication.SIGN_IN)}
                                    text={STRINGS.SIGN_IN}
                                    minimal={true}
                                    intent={Intent.PRIMARY}
                                />
                            </div>
                        </Collapse>
                    </Card>
                </div>
            </div>
        );
    }

    private setAuthentication = (authentication: Authentication) => () => this.setState({ authentication });
}
