import React from "react";
import styles from "./auth.module.scss";
import { handleStringChange } from "../../common/handleStringChange";
import { ContextType, getServices } from "../../common/contextProvider";
import { FormGroup, InputGroup, Button, Intent, H2 } from "@blueprintjs/core";
import { isEmpty } from "lodash-es";

interface IState {
    email: string;
    password: string;
    prevEmail: string;
    prevPassword: string;
}

const DEFAULT_STATE: IState = {
    email: "",
    password: "",
    prevEmail: "",
    prevPassword: "",
};

export class SignIn extends React.PureComponent<{}, IState> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);
    public state: IState = DEFAULT_STATE;
    private static STRINGS = {
        EMAIL_LABEL: "Email address",
        PASSWORD_LABEL: "Password",
        EMAIL_PLACEHOLDER: "larry@google.com",
        PASSWORD_PLACEHOLDER: "password",
        REQUIRED: "(required)",
        MUST_HAVE_EMAIL: "An email address is required",
        MUST_HAVE_PASSWORD: "A password is required",
        SIGN_IN: "Sign in",
        ERROR_SIGNING_IN: "There was an error signing in",
    };

    public render() {
        const { STRINGS } = SignIn;
        return (
            <div className={styles.formSection}>
                <H2>{STRINGS.SIGN_IN}</H2>
                {this.renderForm()}
                {this.renderFormActions()}
            </div>
        );
    }

    private renderForm() {
        const { email, password } = this.state;
        const { STRINGS } = SignIn;
        const emailHelperText = this.getEmailHelperText();
        const passwordHelperText = this.getPasswordHelperText();
        return (
            <div className={styles.form}>
                <FormGroup
                    intent={isEmpty(emailHelperText) ? Intent.NONE : Intent.DANGER}
                    helperText={emailHelperText}
                    label={STRINGS.EMAIL_LABEL}
                    labelFor="email-input"
                    labelInfo={STRINGS.REQUIRED}
                >
                    <InputGroup
                        id="email-input"
                        placeholder={STRINGS.EMAIL_PLACEHOLDER}
                        value={email}
                        onChange={handleStringChange(this.onEmailChange)}
                    />
                </FormGroup>
                <FormGroup
                    intent={isEmpty(passwordHelperText) ? Intent.NONE : Intent.DANGER}
                    helperText={passwordHelperText}
                    label={STRINGS.PASSWORD_LABEL}
                    labelFor="password-input"
                    labelInfo={STRINGS.REQUIRED}
                >
                    <InputGroup
                        id="password-input"
                        placeholder={STRINGS.PASSWORD_PLACEHOLDER}
                        value={password}
                        type="password"
                        onChange={handleStringChange(this.onPasswordChange)}
                    />
                </FormGroup>
            </div>
        );
    }

    private getEmailHelperText() {
        const { email, prevEmail } = this.state;
        const { STRINGS } = SignIn;
        if (isEmpty(email) && !isEmpty(prevEmail)) {
            return STRINGS.MUST_HAVE_EMAIL;
        }
    }

    private getPasswordHelperText() {
        const { password, prevPassword } = this.state;
        const { STRINGS } = SignIn;
        if (isEmpty(password) && !isEmpty(prevPassword)) {
            return STRINGS.MUST_HAVE_PASSWORD;
        }
    }

    private renderFormActions() {
        const { STRINGS } = SignIn;
        return (
            <div className={styles.actions}>
                <Button
                    disabled={this.isSignInDisabled()}
                    intent={Intent.SUCCESS}
                    text={STRINGS.SIGN_IN}
                    onClick={this.signIn}
                />
            </div>
        );
    }

    private isSignInDisabled() {
        return !isEmpty(this.getEmailHelperText()) || !isEmpty(this.getPasswordHelperText());
    }

    private onEmailChange = (email: string) =>
        this.setState(prevState => {
            if (prevState.email === email) {
                return prevState;
            } else {
                return { ...prevState, email, prevTitle: prevState.email };
            }
        });

    private onPasswordChange = (password: string) =>
        this.setState(prevState => {
            if (prevState.password === password) {
                return prevState;
            } else {
                return { ...prevState, password, prevPassword: prevState.password };
            }
        });

    private signIn = () => {
        const { email, password } = this.state;
        const { STRINGS } = SignIn;
        if (!isEmpty(email) && !isEmpty(password)) {
            this.services.userService.signIn(email, password).catch(error => {
                this.services.stateService.showFailToast(error.message || STRINGS.ERROR_SIGNING_IN);
            });
        }
    };
}
