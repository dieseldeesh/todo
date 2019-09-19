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
import { StateService, FileService, UserService } from "./service";
import { createApi } from "./common/createApi";
import { toasterMiddleware, titleMiddleware } from "./middleware";
import { createBrowserHistory } from "history";

const history = createBrowserHistory();
const middlewareEnhancer = composeWithDevTools(
    applyMiddleware(titleMiddleware(), loggingMiddleware(), toasterMiddleware()),
);
const createStoreWithMiddleware = middlewareEnhancer(createStore);
const store = createStoreWithMiddleware(appReducer, createInitialState());

const api = createApi();

const stateService = new StateService(store.dispatch);
const fileService = new FileService(store, api.fileService, api.photoService);
const userService = new UserService(store, api.userService, api.searchService, api.photoService);
ReactDOM.render(
    <Provider store={store}>
        <ContextProvider stateService={stateService} userService={userService} fileService={fileService}>
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
