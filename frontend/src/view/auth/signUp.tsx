import React from "react";
import styles from "./auth.module.scss";
import { handleStringChange } from "../../common/handleStringChange";
import { ContextType, getServices } from "../../common/contextProvider";
import { FormGroup, InputGroup, Button, Intent, H2 } from "@blueprintjs/core";
import { isEmpty } from "lodash-es";

interface IState {
    email: string;
    password: string;
    passwordConfirmation: string;
    prevEmail: string;
    prevPassword: string;
    prevPasswordConfirmation: string;
}

const DEFAULT_STATE: IState = {
    email: "",
    password: "",
    passwordConfirmation: "",
    prevEmail: "",
    prevPassword: "",
    prevPasswordConfirmation: "",
};

export class SignUp extends React.PureComponent<{}, IState> {
    public static contextTypes = ContextType;
    private services = getServices(this.context);
    public state: IState = DEFAULT_STATE;
    private static STRINGS = {
        EMAIL_LABEL: "Email address",
        PASSWORD_LABEL: "Password",
        PASSWORD_CONFIRMATION_LABEL: "Confirm password",
        EMAIL_PLACEHOLDER: "sergey@google.com",
        PASSWORD_PLACEHOLDER: "password",
        REQUIRED: "(required)",
        MUST_HAVE_EMAIL: "An email address is required",
        MUST_HAVE_PASSWORD: "A password is required",
        MUST_HAVE_PASSWORD_CONFIRMATION: "Please confirm your password",
        PASSWORD_MISMATCH: "Passwords do not match",
        SIGN_UP: "Sign up",
        ERROR_SIGNING_UP: "There was an error signing up",
    };

    public render() {
        const { STRINGS } = SignUp;
        return (
            <div className={styles.formSection}>
                <H2>{STRINGS.SIGN_UP}</H2>
                {this.renderForm()}
                {this.renderFormActions()}
            </div>
        );
    }

    private renderForm() {
        const { email, password, passwordConfirmation } = this.state;
        const { STRINGS } = SignUp;
        const emailHelperText = this.getEmailHelperText();
        const passwordHelperText = this.getPasswordHelperText();
        const passwordConfirmationHelperText = this.getPasswordConfirmationHelperText();
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
                <FormGroup
                    intent={isEmpty(passwordConfirmationHelperText) ? Intent.NONE : Intent.DANGER}
                    helperText={passwordConfirmationHelperText}
                    label={STRINGS.PASSWORD_CONFIRMATION_LABEL}
                    labelFor="password-confirmation-input"
                    labelInfo={STRINGS.REQUIRED}
                >
                    <InputGroup
                        id="password-confirmation-input"
                        placeholder={STRINGS.PASSWORD_PLACEHOLDER}
                        value={passwordConfirmation}
                        type="password"
                        onChange={handleStringChange(this.onPasswordConfirmationChange)}
                    />
                </FormGroup>
            </div>
        );
    }

    private getEmailHelperText() {
        const { email, prevEmail } = this.state;
        const { STRINGS } = SignUp;
        if (isEmpty(email) && !isEmpty(prevEmail)) {
            return STRINGS.MUST_HAVE_EMAIL;
        }
    }

    private getPasswordHelperText() {
        const { password, prevPassword } = this.state;
        const { STRINGS } = SignUp;
        if (isEmpty(password) && !isEmpty(prevPassword)) {
            return STRINGS.MUST_HAVE_PASSWORD;
        }
    }

    private getPasswordConfirmationHelperText() {
        const { password, passwordConfirmation, prevPasswordConfirmation } = this.state;
        const { STRINGS } = SignUp;
        if (isEmpty(passwordConfirmation) && !isEmpty(prevPasswordConfirmation)) {
            return STRINGS.MUST_HAVE_PASSWORD_CONFIRMATION;
        } else if (passwordConfirmation !== password && !isEmpty(passwordConfirmation)) {
            return STRINGS.PASSWORD_MISMATCH;
        }
    }

    private renderFormActions() {
        const { STRINGS } = SignUp;
        return (
            <div className={styles.actions}>
                <Button
                    disabled={this.isSignUpDisabled()}
                    intent={Intent.SUCCESS}
                    text={STRINGS.SIGN_UP}
                    onClick={this.signUp}
                />
            </div>
        );
    }

    private isSignUpDisabled() {
        return (
            !isEmpty(this.getEmailHelperText()) ||
            !isEmpty(this.getPasswordHelperText()) ||
            !isEmpty(this.getPasswordConfirmationHelperText())
        );
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

    private onPasswordConfirmationChange = (passwordConfirmation: string) =>
        this.setState(prevState => {
            if (prevState.passwordConfirmation === passwordConfirmation) {
                return prevState;
            } else {
                return { ...prevState, passwordConfirmation, prevPasswordConfirmation: prevState.passwordConfirmation };
            }
        });

    private signUp = () => {
        const { email, password } = this.state;
        const { STRINGS } = SignUp;
        if (!isEmpty(email) && !isEmpty(password)) {
            this.services.userService.signUp(email, password).catch(error => {
                this.services.stateService.showFailToast(error.message || STRINGS.ERROR_SIGNING_UP);
            });
        }
    };
}
