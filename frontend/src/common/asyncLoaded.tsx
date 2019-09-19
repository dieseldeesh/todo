import React from "react";
import { IAsyncLoaded, AsyncLoadedValue } from "./redoodle";
import { assertNever } from "./assertNever";
import { NullableValue } from "./nullableValue";

interface IProps<T, E> {
    asyncLoadedValue: IAsyncLoaded<T, E>;
    renderLoaded: (value: T) => React.ReactNode;
    renderReloading?: (value: T) => React.ReactNode;
    renderFailed?: (error: E) => React.ReactNode;
    renderLoading?: () => React.ReactNode;
    renderNotStartedLoading?: () => React.ReactNode;
}

export class AsyncLoaded<T, E> extends React.PureComponent<IProps<T, E>> {
    public static ofType<T, E>() {
        return AsyncLoaded as new (props: IProps<T, E>) => AsyncLoaded<T, E>;
    }

    public render() {
        const {
            renderNotStartedLoading,
            renderLoading,
            renderFailed,
            renderReloading,
            renderLoaded,
            asyncLoadedValue,
        } = this.props;
        if (AsyncLoadedValue.isLoading(asyncLoadedValue)) {
            return NullableValue.of(renderLoading)
                .map(presentRenderLoaded => presentRenderLoaded())
                .getOrNull();
        } else if (AsyncLoadedValue.isLoadingFailed(asyncLoadedValue)) {
            return NullableValue.of(renderFailed)
                .map(presentRenderFailed => presentRenderFailed(asyncLoadedValue.error))
                .getOrNull();
        } else if (AsyncLoadedValue.isLoadingSucceeded(asyncLoadedValue)) {
            return renderLoaded(asyncLoadedValue.value);
        } else if (AsyncLoadedValue.isNotStartedLoading(asyncLoadedValue)) {
            return NullableValue.of(renderNotStartedLoading)
                .map(presentRenderNotStartedLoading => presentRenderNotStartedLoading())
                .getOrNull();
        } else if (AsyncLoadedValue.isReloading(asyncLoadedValue)) {
            return NullableValue.of(renderReloading)
                .map(presentRenderReloading => presentRenderReloading(asyncLoadedValue.value))
                .getOrDefault(renderLoaded(asyncLoadedValue.value));
        } else {
            return assertNever(asyncLoadedValue);
        }
    }
}
