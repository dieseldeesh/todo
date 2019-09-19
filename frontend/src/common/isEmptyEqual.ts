import { isEqual, isEmpty } from "lodash-es";

export function isEmptyEqual(current: number | string | null, previous: number | string | null) {
    return isEqual(current, previous) || (isEmpty(current) && isEmpty(previous));
}
