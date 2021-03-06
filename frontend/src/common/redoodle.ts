import { TypedAction, TypedReducer, Action, TypedActionString } from "redoodle";
import { assertNever } from "./assertNever";

export enum AsyncStatus {
    NOT_STARTED_LOADING = "NOT_STARTED_LOADING",
    LOADING = "LOADING",
    LOADING_SUCCEEDED = "LOADING_SUCCEEDED",
    LOADING_FAILED = "LOADING_FAILED",
    RELOADING = "RELOADING"
}

export interface IAsyncNotStartedLoading {
    status: AsyncStatus.NOT_STARTED_LOADING;
}

export interface IAsyncLoading {
    progress: number | undefined;
    status: AsyncStatus.LOADING;
}

export interface IAsyncLoadingSucceeded<V> {
    status: AsyncStatus.LOADING_SUCCEEDED;
    value: V;
}

export interface IAsyncLoadingFailed<V, E = Error> {
    error: E;
    status: AsyncStatus.LOADING_FAILED;
    previousValue?: V;
}

export interface IAsyncReloading<V> {
    progress: number | undefined;
    status: AsyncStatus.RELOADING;
    value: V;
}

export type IAsyncLoaded<V, E = Error> =
    | IAsyncNotStartedLoading
    | IAsyncLoading
    | IAsyncLoadingSucceeded<V>
    | IAsyncReloading<V>
    | IAsyncLoadingFailed<V, E>;

export class AsyncLoadedValue {

    private static EMPTY_ASYNC_LOADING: IAsyncLoading = {
        status: AsyncStatus.LOADING,
        progress: undefined,
    };

    private static EMPTY_ASYNC_NOT_STARTED_LOADING: IAsyncNotStartedLoading = {
        status: AsyncStatus.NOT_STARTED_LOADING,
    };

    public static isNotStartedLoading<V, E>(
        state: IAsyncLoaded<V, E> | undefined
    ): state is IAsyncNotStartedLoading | undefined {
        return undefined === state || state.status === AsyncStatus.NOT_STARTED_LOADING;
    }

    public static isLoading<V, E>(state: IAsyncLoaded<V, E> | undefined): state is IAsyncLoading {
        return undefined !== state && state.status === AsyncStatus.LOADING;
    }

    public static isLoadingSucceeded<V, E>(state: IAsyncLoaded<V, E> | undefined): state is IAsyncLoadingSucceeded<V> {
        return undefined !== state && state.status === AsyncStatus.LOADING_SUCCEEDED;
    }

    public static isLoadingFailed<V, E>(state: IAsyncLoaded<V, E> | undefined): state is IAsyncLoadingFailed<V, E> {
        return undefined !== state && state.status === AsyncStatus.LOADING_FAILED;
    }

    public static isReloading<V, E>(state: IAsyncLoaded<V, E> | undefined): state is IAsyncReloading<V> {
        return undefined !== state && state.status === AsyncStatus.RELOADING;
    }

    public static isReady<V, E>(
        state: IAsyncLoaded<V, E> | undefined,
    ): state is IAsyncLoadingSucceeded<V> | IAsyncReloading<V> {
        return AsyncLoadedValue.isLoadingSucceeded(state) || AsyncLoadedValue.isReloading(state);
    }

    public static hasValue<V, E>(
        state: IAsyncLoaded<V, E> | undefined,
    ): state is IAsyncLoadingSucceeded<V> | IAsyncReloading<V> | IAsyncLoadingFailed<V, E> {
        return AsyncLoadedValue.isReady(state)
            || (AsyncLoadedValue.isLoadingFailed(state) && undefined !== state.previousValue);
    }

    public static asyncNotStartedLoading(): IAsyncNotStartedLoading {
        return AsyncLoadedValue.EMPTY_ASYNC_NOT_STARTED_LOADING;
    }

    public static asyncLoading(progress?: number): IAsyncLoading {
        if (progress === undefined) {
            return AsyncLoadedValue.EMPTY_ASYNC_LOADING;
        }
        return {
            progress,
            status: AsyncStatus.LOADING,
        };
    }

    public static asyncLoadingSucceeded<V>(value: V): IAsyncLoadingSucceeded<V> {
        return {
            status: AsyncStatus.LOADING_SUCCEEDED,
            value,
        };
    }

    public static asyncLoadingFailed<V, E>(error: E, previousValue?: V): IAsyncLoadingFailed<V, E> {
        return {
            error,
            status: AsyncStatus.LOADING_FAILED,
            previousValue,
        };
    }

    public static asyncReloading<V>(value: V, progress?: number): IAsyncReloading<V> {
        return {
            progress,
            status: AsyncStatus.RELOADING,
            value,
        };
    }

    public static mapAsyncLoaded<V, E, T>(async: IAsyncLoaded<V, E>, selector: (value: V) => T): IAsyncLoaded<T, E> {
        if (AsyncLoadedValue.isReady(async)) {
            return { ...async, value: selector(async.value) };
        }
        if (AsyncLoadedValue.isLoadingFailed(async)) {
            if (async.previousValue !== undefined) {
                return { ...async, previousValue: selector(async.previousValue!) };
            }
            return { status: async.status, error: async.error };
        }
        return async;
    }

    public static getValueOrUndefined<V, E>(async: IAsyncLoaded<V, E>) {
        return AsyncLoadedValue.getValueOrDefault(async, undefined);

    }

    public static getValueOrNull<V, E>(async: IAsyncLoaded<V, E>) {
        return AsyncLoadedValue.getValueOrDefault(async, null);
    }

    public static getValueOrDefault<V, E>(async: IAsyncLoaded<V, E>, defaultValue: V) {
        return this.isReady(async) ? async.value : defaultValue;
    }

    public static valueCheck<V, E>(
        async: IAsyncLoaded<V, E>,
        check: (value: V) => boolean,
        ifNoValue: boolean = false): boolean {
        return this.isReady(async) ? check(async.value) : ifNoValue;
    }
}

export interface TypedAsyncAction<P, S, F> {
    Clear: TypedAction.Definition<string, undefined>;
    Failure: TypedAction.Definition<string, F>;
    InProgress: TypedAction.Definition<string, P>;
    Success: TypedAction.Definition<string, S>;
}

export const TypedAsyncAction = {
    define: (type: string) => {
        return <P, S, F>() => ({
            Clear: TypedAction.define(type + "_CLEAR")<undefined>(),
            Failure: TypedAction.define(type + "_FAILURE")<F>(),
            InProgress: TypedAction.define(type + "_IN_PROGRESS")<P>(),
            Success: TypedAction.define(type + "_SUCCESS")<S>(),
        });
    }
}

interface Builder<V, E = Error> extends TypedReducer.Builder<IAsyncLoaded<V, E>> {
    withAsyncLoadHandler<P, S, F>(
        action: TypedAsyncAction<P, S, F>,
        getValue: (payload: S) => V,
        getError: (payload: F) => E,
        getProgress?: (payload: P) => number,
    ): this;
}

class TypedAsyncLoadedReducerImpl<V, E = Error> implements Builder<V, E> {
    private builder = TypedReducer.builder<IAsyncLoaded<V, E>>();
    private defaultHandler: (state: IAsyncLoaded<V, E>, action: Action) => IAsyncLoaded<V, E> =
        (state = { status: AsyncStatus.NOT_STARTED_LOADING }) => state;

    public withAsyncLoadHandler<P, S, F>(
        action: TypedAsyncAction<P, S, F>,
        getValue: (payload: S) => V,
        getError: (payload: F) => E,
        getProgress?: (payload: P) => number,
    ) {
        this.builder
            .withHandler(action.Clear.TYPE, () => AsyncLoadedValue.asyncNotStartedLoading())
            .withHandler(
                action.InProgress.TYPE,
                (state, payload): IAsyncLoading | IAsyncReloading<V> => {
                    const progress = undefined !== getProgress ? getProgress(payload) : undefined;
                    if (AsyncLoadedValue.isNotStartedLoading(state)
                        || AsyncLoadedValue.isLoading(state)
                        || AsyncLoadedValue.isLoadingFailed(state)) {
                        return AsyncLoadedValue.asyncLoading(progress);
                    } else if (AsyncLoadedValue.isLoadingSucceeded(state) || AsyncLoadedValue.isReloading(state)) {
                        return AsyncLoadedValue.asyncReloading(state.value, progress);
                    }
                    return assertNever(state);
                },
            )
            .withHandler(
                action.Success.TYPE,
                (_state, payload): IAsyncLoadingSucceeded<V> => AsyncLoadedValue.asyncLoadingSucceeded(getValue(payload))
            )
            .withHandler(
                action.Failure.TYPE,
                (_state, payload): IAsyncLoadingFailed<V, E> => AsyncLoadedValue.asyncLoadingFailed(getError(payload))
            );

        return this;
    }

    public withActionHandler<P, T extends string = string>(
        type: TypedActionString<P, T>,
        handler: (state: IAsyncLoaded<V, E>, action: TypedAction<P, T>) => IAsyncLoaded<V, E>,
    ): this {
        this.builder.withActionHandler(type, handler);
        return this;
    }

    public withHandler<P>(
        type: TypedActionString<P>,
        handler: (state: IAsyncLoaded<V, E>, payload: P, meta?: any) => IAsyncLoaded<V, E>,
    ): this {
        this.builder.withHandler(type, handler);
        return this;
    }

    public withDefaultHandler(handler: (state: IAsyncLoaded<V, E>, action: Action) => IAsyncLoaded<V, E>) {
        this.defaultHandler = handler;
        return this;
    }

    public build(): (state: IAsyncLoaded<V, E> | undefined, action: Action) => IAsyncLoaded<V, E> {
        const reducer = this.builder
            .withDefaultHandler(this.defaultHandler)
            .build();
        return reducer as (state: IAsyncLoaded<V, E> | undefined, action: Action) => IAsyncLoaded<V, E>;
    }
}

export const TypedAsyncLoadedReducer = {
    builder: <V, E = Error>() => {
        return new TypedAsyncLoadedReducerImpl<V, E>();
    }
}
