import { IEndpoints, IApplicationApi } from "../state";
import { ITaskService, TaskService } from "../api";
import { DefaultHttpApiBridge, IHttpApiBridge } from "conjure-client";

const APPLICATION_NAME = "task-app";
const APPLICATION_VERSION = "0.0.0";

export function createApi(endpoints: IEndpoints): IApplicationApi {
    const backendApi = getApiOrThrow(endpoints, "backendApi");
    const userAgent = { productName: APPLICATION_NAME, productVersion: APPLICATION_VERSION };
    const httpApiBridge: IHttpApiBridge = new DefaultHttpApiBridge({ baseUrl: backendApi, userAgent });
    const taskService: ITaskService = new TaskService(httpApiBridge);
    return { taskService };
}

function getApiOrThrow(endpoints: IEndpoints, apiKey: keyof IEndpoints) {
    const api = endpoints[apiKey];
    if (api == null) {
        throw new Error(`API not found for apiKey: ${apiKey}`);
    }
    return api;
}
