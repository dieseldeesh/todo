import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import { App } from "./view/app/app";
import * as serviceWorker from "./serviceWorker";
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { loggingMiddleware } from "redoodle";
import { applyMiddleware, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { createInitialState, appReducer } from "./state";
import { ContextProvider } from "./common/contextProvider";
import { StateService, TaskService } from "./service";
import { createApi } from "./common/createApi";
import { toasterMiddleware, titleMiddleware } from "./middleware";
import { createBrowserHistory } from "history";

const BACKEND_API = process.env.REACT_APP_BACKEND_API || "https://backend-dot-adhish-test-project.appspot.com";
const history = createBrowserHistory();
const middlewareEnhancer = composeWithDevTools(
    applyMiddleware(titleMiddleware(), loggingMiddleware(), toasterMiddleware()),
);
const createStoreWithMiddleware = middlewareEnhancer(createStore);
const store = createStoreWithMiddleware(appReducer, createInitialState(history));

const api = createApi({ backendApi: BACKEND_API });

const stateService = new StateService(store.dispatch);
const taskService = new TaskService(store, api.taskService);
ReactDOM.render(
    <Provider store={store}>
        <ContextProvider stateService={stateService} taskService={taskService}>
            <Router history={history}>
                <App />
            </Router>
        </ContextProvider>
    </Provider>,
    document.getElementById("root"),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
