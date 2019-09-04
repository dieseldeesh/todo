import { Dispatch } from "redux";
import { Action } from "redoodle";
import { SetTitle, ClearHomeState, CreateToast } from "../state";
import { AppAction } from "../state/types";
import { SetAppAction, SetShowIncompletedTasks } from "../state/actions";

export class StateService {
    constructor(private dispatch: Dispatch<Action>) {}

    public clearHomeState() {
        this.dispatch(ClearHomeState.create(undefined));
    }

    public toggleShowIncompletedTasks(setShowIncompletedTasks: boolean) {
        this.dispatch(SetShowIncompletedTasks.create(setShowIncompletedTasks));
    }

    public setAppAction(action: AppAction) {
        this.dispatch(SetAppAction.create(action));
    }

    public setDocumentTitle(title: string) {
        this.dispatch(SetTitle.create(title));
    }

    public showFailToast(toast: string) {
        this.dispatch(CreateToast.Failure.create(toast));
    }

    public showSuccessToast(toast: string) {
        this.dispatch(CreateToast.Success.create(toast));
    }

    public showInProgressToast(toast: string) {
        this.dispatch(CreateToast.InProgress.create(toast));
    }
}
