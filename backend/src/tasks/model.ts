import { Datastore, Query } from "@google-cloud/datastore";
import { filter } from "minimatch";

const ds = new Datastore();
const kind = "Task";

function fromDatastore(obj: any) {
    obj.id = obj[Datastore.KEY].id;
    return obj;
}

function toDatastore(obj: { [key: string]: any }, nonIndexed: string[]) {
    nonIndexed = nonIndexed || [];
    const results: any[] = [];
    Object.keys(obj).forEach((k) => {
        if (obj[k] === undefined) {
            return;
        }
        results.push({
            excludeFromIndexes: nonIndexed.indexOf(k) !== -1,
            name: k,
            value: obj[k],
        });
    });
    return results;
}

function listCompleted(limit: any, token: any, cb: any) {
    const q = ds
        .createQuery([kind])
        .limit(limit)
        .order("dueDate")
        .filter("status", "=", 0)
        .start(token);
    runQuery(q, cb);
}

function listInComplete(limit: any, token: any, cb: any) {
    const q = ds
        .createQuery([kind])
        .limit(limit)
        .order("status")
        .order("dueDate")
        .filter("status", ">", 0)
        .start(token);
    runQuery(q, cb);
}

function runQuery(q: Query, cb: any) {
    ds.runQuery(q, (err, entities, nextQuery) => {
        if (err) {
            cb(err);
            return;
        }
        const hasMore =
            nextQuery == null
                ? false
                : nextQuery.moreResults !== Datastore.NO_MORE_RESULTS
                ? nextQuery.endCursor
                : false;
        cb(null, entities == null ? [] : entities.map(fromDatastore), hasMore);
    });
}

function update(id: any, data: any, cb: any) {
    let key;
    if (id) {
        key = ds.key([kind, parseInt(id, 10)]);
    } else {
        key = ds.key(kind);
    }

    const entity = {
        data: toDatastore(data, ["description"]),
        key,
    };

    ds.save(entity, (err) => {
        data.id = entity.key.id;
        cb(err, err ? null : data);
    });
}

function create(data: any, cb: any) {
    update(null, data, cb);
}

function read(id: any, cb: any) {
    const key = ds.key([kind, parseInt(id, 10)]);
    ds.get(key, (err, entity) => {
        if (!err && !entity) {
            err = {
                code: 404,
                message: "Not found",
            };
        }
        if (err) {
            cb(err);
            return;
        }
        cb(null, fromDatastore(entity));
    });
}

function _delete(id: any, cb: any) {
    const key = ds.key([kind, parseInt(id, 10)]);
    ds.delete(key, cb);
}

export const model = {
    create,
    delete: _delete,
    listCompleted,
    listInComplete,
    read,
    update,
};
