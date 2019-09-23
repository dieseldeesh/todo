import * as functions from "firebase-functions";
import mkdirp from "mkdirp-promise";
import admin from "firebase-admin";
import algoliasearch from "algoliasearch";
import cpp from "child-process-promise";
import path from "path";
import os from "os";
import fs from "fs";

// Max height and width of the thumbnail in pixels.
const THUMB_MAX_HEIGHT = 500;
const THUMB_MAX_WIDTH = 500;
// Thumbnail prefix added to file names.
const THUMB_PREFIX = "thumb_";

admin.initializeApp();
const algoliaClient = algoliasearch(functions.config().algolia.appid, functions.config().algolia.apikey);
const userIndex = algoliaClient.initIndex("users");

interface IUserProfile {
    displayName: string | undefined;
    email: string | undefined;
    photoURL: string | undefined;
    id: string;
}

interface ICrop {
    x: number;
    y: number;
    width: number;
    height: number;
    naturalHeight: number;
    naturalWidth: number;
}

enum FileType {
    PROJECT = "project",
    TASK = "task",
}

// export const onFileCreate = functions.firestore
//     .document("file/{fileId}")
//     .onUpdate((snapshot: FirebaseFirestore.DocumentSnapshot) => {
//         admin.messaging().sendToTopic()
//     }
//         Promise.all([saveDocumentInAlgolia(snapshot), createUserProject(snapshot)]),
//     );

export const searchUsers = functions.https.onCall(
    (data, context): Promise<Array<IUserProfile>> => {
        const { auth } = context;
        if (isNotNullish(auth)) {
            const { query } = data;
            if (isNotNullish(query)) {
                return new Promise((resolve, reject) => {
                    userIndex.search({ query }, (err, response) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        resolve(
                            response.hits.map(
                                (hit): IUserProfile => ({
                                    displayName: hit.displayName,
                                    email: hit.email,
                                    id: hit.objectID,
                                    photoURL: hit.photoURL,
                                }),
                            ),
                        );
                    });
                });
            } else {
                throw new functions.https.HttpsError("invalid-argument", "Invalid search query");
            }
        } else {
            throw new functions.https.HttpsError("failed-precondition", "User not signed in");
        }
    },
);

export const fetchUsers = functions.https.onCall(
    (data, context): Promise<Array<IUserProfile>> => {
        const { auth } = context;
        if (isNotNullish(auth)) {
            const { userIds } = data;
            if (isNotNullish(userIds) && userIds.length > 0) {
                return new Promise((resolve, reject) => {
                    const filters: string = userIds.map((userId: string) => `objectID:${userId}`).join(" OR ");
                    userIndex.search({ query: "", filters }, (err, response) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        resolve(
                            response.hits.map(
                                (hit): IUserProfile => ({
                                    displayName: hit.displayName,
                                    email: hit.email,
                                    id: hit.objectID,
                                    photoURL: hit.photoURL,
                                }),
                            ),
                        );
                    });
                });
            } else {
                throw new functions.https.HttpsError("invalid-argument", "Invalid search query");
            }
        } else {
            throw new functions.https.HttpsError("failed-precondition", "User not signed in");
        }
    },
);

export const indexUsers = functions.https.onRequest(async (req, res) => {
    const querySnapshot = await admin
        .firestore()
        .collection("users")
        .get();
    const records = querySnapshot.docs.map(doc => {
        const document = doc.data();
        return {
            objectID: doc.id,
            displayName: document.displayName,
            email: document.email,
            photoURL: document.photoURL,
        };
    });
    console.log(`Retrieved ${records.length} user(s)`);
    userIndex.saveObjects(records, (_error: any, content: any) => {
        res.status(200).send("All the users were indexed to Algolia successfully.");
    });
});

export const projectsOnDelete = functions.firestore
    .document("files/{fileId}")
    .onDelete((snapshot: FirebaseFirestore.DocumentSnapshot) => {
        const filesCollection = admin.firestore().collection("files");
        return filesCollection
            .where("parentProjectId", "==", snapshot.id)
            .get()
            .then(querySnapshot => Promise.all(querySnapshot.docs.map(doc => filesCollection.doc(doc.id).delete())));
    });

export const usersOnCreate = functions.firestore
    .document("users/{userId}")
    .onCreate((snapshot: FirebaseFirestore.DocumentSnapshot) =>
        Promise.all([saveDocumentInAlgolia(snapshot), createUserProject(snapshot)]),
    );

export const usersOnUpdate = functions.firestore.document("users/{userId}").onUpdate(updateDocumentInAlgolia);

export const usersOnDelete = functions.firestore
    .document("users/{userId}")
    .onDelete((snapshot: FirebaseFirestore.DocumentSnapshot) =>
        Promise.all([
            deleteDocumentFromAlgolia(snapshot),
            deleteUserProject(snapshot),
            deleteUserProfilePicture(snapshot),
        ]),
    );

export const generateThumbnail = functions.storage.object().onFinalize(async object => {
    const { name: filePath, contentType } = object;
    if (isNullish(filePath) || isNullish(contentType)) {
        throw new functions.https.HttpsError("failed-precondition", "User not signed in");
    }
    const parts = filePath.split("/");
    if (parts.length !== 3) {
        console.log("invalid path", filePath);
        return;
    }
    const userId = parts[1];
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const tempLocalCropFilePath = path.normalize(path.join(fileDir, `crop_${fileName}`));
    const tempLocalThumbFilePath = path.normalize(path.join(fileDir, `thumb_${fileName}`));
    const thumbFilePath = path.normalize(path.join(fileDir, `thumb/${fileName}`));
    const tempLocalFile = path.join(os.tmpdir(), filePath);
    const tempLocalDir = path.dirname(tempLocalFile);
    const tempLocalCropFile = path.join(os.tmpdir(), tempLocalCropFilePath);
    const tempLocalThumbFile = path.join(os.tmpdir(), tempLocalThumbFilePath);

    if (!contentType.startsWith("image/")) {
        console.log("This is not an image.");
        return;
    }

    if (fileName.startsWith(THUMB_PREFIX)) {
        console.log("Already a Thumbnail.");
        return;
    }

    const document = await admin
        .firestore()
        .collection("crops")
        .doc(userId)
        .get();

    const data = document.data();
    if (data === null) {
        console.log("Nothing to crop.");
        return;
    }
    const crop = data as ICrop;
    const height = Math.min((crop.naturalHeight * THUMB_MAX_HEIGHT) / crop.naturalWidth, THUMB_MAX_HEIGHT);
    const width = Math.min((crop.naturalWidth * THUMB_MAX_WIDTH) / crop.naturalHeight, THUMB_MAX_WIDTH);
    const scaleX = crop.naturalWidth / width;
    const scaleY = crop.naturalHeight / height;
    const newX = Math.round(crop.x * scaleX);
    const newY = Math.round(crop.y * scaleY);
    const newWidth = Math.round(crop.width * scaleX);
    const newHeight = Math.round(crop.height * scaleY);
    // Cloud Storage files.
    const bucket = admin.storage().bucket(object.bucket);
    const file = bucket.file(filePath);

    // Create the temp directory where the storage file will be downloaded.
    await mkdirp(tempLocalDir);
    // Download file from bucket.
    await file.download({ destination: tempLocalFile });
    console.log("The file has been downloaded to", tempLocalFile);
    // Generate a thumbnail using ImageMagick.
    await cpp.spawn(
        "convert",
        [tempLocalFile, "-crop", `${newWidth}x${newHeight}+${newX}+${newY}`, tempLocalCropFile],
        {
            capture: ["stdout", "stderr"],
        },
    );
    await cpp.spawn(
        "convert",
        [tempLocalCropFile, "-thumbnail", `${THUMB_MAX_WIDTH}x${THUMB_MAX_HEIGHT}>`, tempLocalThumbFile],
        { capture: ["stdout", "stderr"] },
    );
    console.log("Thumbnail created at", tempLocalThumbFile);
    // Uploading the Thumbnail.
    await bucket.upload(tempLocalThumbFile, {
        destination: thumbFilePath,
        metadata: {
            contentType,
        },
    });
    console.log("Thumbnail uploaded to Storage at", thumbFilePath);
    // Once the image has been uploaded delete the local files to free up disk space.
    fs.unlinkSync(tempLocalFile);
    fs.unlinkSync(tempLocalCropFile);
    fs.unlinkSync(tempLocalThumbFile);
    console.log("Thumbnail URLs saved to database.");
    await file.delete();
    await admin
        .firestore()
        .collection("crops")
        .doc(userId)
        .delete();
    const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
    const userData = userDoc.data();
    await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .update({ photoURL: thumbFilePath });
    if (isNotNullish(userData)) {
        const { photoURL } = userData as IUserProfile;
        if (photoURL) {
            await bucket.file(photoURL).delete();
        }
    }
    console.log("deleted original file and crops document");
});

export const saveFile = functions.https.onCall((data, context) => {
    const { file, fileId } = data;
    if (isNullish(context.auth)) {
        throw new functions.https.HttpsError("failed-precondition", "User not signed in");
    }
    const { uid } = context.auth;
    const { title, description, members, type } = file;
    const filesCollection = admin.firestore().collection("files");
    const usersCollection = admin.firestore().collection("users");
    if (
        !(
            isNotNullish(title) &&
            typeof title === "string" &&
            isNotNullish(description) &&
            typeof description === "string" &&
            isNotNullish(members) &&
            members instanceof Array &&
            members.includes(uid) &&
            (type === "project" || type === "task")
        )
    ) {
        throw new functions.https.HttpsError("failed-precondition", "Invalid file 1");
    } else if (type === "task") {
        const { assignee, difficulty, importance, parentProjectId, status } = file;
        if (isNotNullish(fileId) && typeof fileId !== "string") {
            throw new functions.https.HttpsError("failed-precondition", "Invalid file 2.0");
        } else if (isNullish(status) || typeof status !== "number" || status < 0 || status > 3) {
            throw new functions.https.HttpsError("failed-precondition", `Invalid file 2.1: ${status}`);
        } else if (
            isNullish(assignee) ||
            typeof assignee !== "string" ||
            isNullish(parentProjectId) ||
            typeof parentProjectId !== "string" ||
            (isNotNullish(difficulty) && (typeof difficulty !== "number" || difficulty < 0 || difficulty > 2)) ||
            (isNotNullish(importance) && (typeof importance !== "number" || importance < 0 || importance > 4))
        ) {
            throw new functions.https.HttpsError("failed-precondition", "Invalid file 2.2");
        }
        const docs: FirebaseFirestore.DocumentReference[] = [];
        docs.push(filesCollection.doc(parentProjectId));
        docs.push(usersCollection.doc(assignee));
        if (isNotNullish(fileId)) {
            docs.push(filesCollection.doc(fileId));
        } else {
            docs.push(filesCollection.doc());
        }
        return admin.firestore().runTransaction(transaction => {
            return transaction.getAll(...docs).then(resolvedDocs => {
                const parentProjectDoc = resolvedDocs[0];
                const assigneeDoc = resolvedDocs[1];
                const actualFileDoc = resolvedDocs[2];
                const parentProjectData = parentProjectDoc.data();
                const assigneeData = assigneeDoc.data();
                const actualFileData = actualFileDoc.data();
                if (
                    !parentProjectDoc.exists ||
                    isNullish(parentProjectData) ||
                    parentProjectData.type !== "project" ||
                    !isEqualMembers(parentProjectData.members, members) ||
                    !assigneeDoc.exists ||
                    isNullish(assigneeData) ||
                    (isNotNullish(fileId) && (!actualFileDoc.exists || isNullish(actualFileData)))
                ) {
                    throw new functions.https.HttpsError("failed-precondition", "Invalid file 3");
                }
                if (isNotNullish(fileId) && isNotNullish(actualFileData)) {
                    const { members: oldMembers, parentProjectId: oldParentProjectId, type: oldType } = actualFileData;
                    if (
                        !(
                            type === oldType &&
                            oldParentProjectId === parentProjectId &&
                            isEqualMembers(oldMembers, members)
                        )
                    ) {
                        throw new functions.https.HttpsError("failed-precondition", "Invalid file 4");
                    }
                }
                transaction.set(docs[2], { ...file, modifiedAt: admin.firestore.Timestamp.fromDate(new Date()) });
                return docs[2].id;
            });
        });
    } else {
        const { parentProjectId } = file;
        if (
            (isNotNullish(fileId) && typeof fileId !== "string") ||
            (isNotNullish(parentProjectId) && typeof parentProjectId !== "string")
        ) {
            throw new functions.https.HttpsError("failed-precondition", "Invalid file 5");
        }
        const docs: FirebaseFirestore.DocumentReference[] = [];
        if (isNotNullish(parentProjectId)) {
            docs.push(filesCollection.doc(parentProjectId));
        } else {
            docs.push(filesCollection.doc());
        }
        if (isNotNullish(fileId)) {
            docs.push(filesCollection.doc(fileId));
        } else {
            docs.push(filesCollection.doc());
        }
        return admin.firestore().runTransaction(transaction => {
            return transaction.getAll(...docs).then(resolvedDocs => {
                const parentProjectDoc = resolvedDocs[0];
                const actualFileDoc = resolvedDocs[1];
                const parentProjectData = parentProjectDoc.data();
                const actualFileData = actualFileDoc.data();
                if (
                    (isNotNullish(parentProjectId) &&
                        (!parentProjectDoc.exists ||
                            isNullish(parentProjectData) ||
                            parentProjectData.type !== "project" ||
                            !isEqualMembers(parentProjectData.members, members))) ||
                    (isNotNullish(fileId) && (!actualFileDoc.exists || isNullish(actualFileData)))
                ) {
                    throw new functions.https.HttpsError("failed-precondition", "Invalid file 6");
                }
                if (isNotNullish(fileId) && isNotNullish(actualFileData)) {
                    const { members: oldMembers, parentProjectId: oldParentProjectId, type: oldType } = actualFileData;
                    if (
                        !(
                            type === oldType &&
                            oldParentProjectId === parentProjectId &&
                            isEqualMembers(oldMembers, members)
                        )
                    ) {
                        throw new functions.https.HttpsError("failed-precondition", "Invalid file 7");
                    }
                }
                transaction.set(docs[1], { ...file, modifiedAt: admin.firestore.Timestamp.fromDate(new Date()) });
                return docs[1].id;
            });
        });
    }
});

function createUserProject(snapshot: FirebaseFirestore.DocumentSnapshot) {
    if (snapshot.exists) {
        const record = snapshot.data();
        if (isNotNullish(record)) {
            return admin
                .firestore()
                .collection("files")
                .doc(snapshot.id)
                .set({
                    title: "Private",
                    description: "Your private project",
                    members: [snapshot.id],
                    parentProjectId: null,
                    type: FileType.PROJECT,
                    modifiedAt: admin.firestore.Timestamp.fromDate(new Date()),
                });
        }
    }
    return Promise.reject();
}

function deleteUserProject(snapshot: FirebaseFirestore.DocumentSnapshot) {
    if (snapshot.exists) {
        return admin
            .firestore()
            .collection("files")
            .doc(snapshot.id)
            .delete();
    }
    return Promise.reject();
}

function deleteUserProfilePicture(snapshot: FirebaseFirestore.DocumentSnapshot) {
    if (snapshot.exists) {
        return admin
            .storage()
            .bucket(`images/${snapshot.id}`)
            .delete();
    }
    return Promise.reject();
}

// function sendNotification(snapshot: FirebaseFirestore.DocumentSnapshot) {
//     if (snapshot.exists) {
//         const record = snapshot.data();
//         if (isNotNullish(record)) {
//             admin.messaging().sendToTopic(snapshot.id, );
//             record.objectID = snapshot.id;
//             return userIndex.saveObject(record);
//         }
//     }
//     return Promise.reject();
// }

function saveDocumentInAlgolia(snapshot: FirebaseFirestore.DocumentSnapshot) {
    if (snapshot.exists) {
        const record = snapshot.data();
        if (isNotNullish(record)) {
            record.objectID = snapshot.id;
            return userIndex.saveObject(record);
        }
    }
    return Promise.reject();
}

function updateDocumentInAlgolia(change: functions.Change<FirebaseFirestore.DocumentSnapshot>) {
    const docBeforeChange = change.before.data();
    const docAfterChange = change.after.data();
    if (docBeforeChange && docAfterChange) {
        return saveDocumentInAlgolia(change.after);
    }
    return Promise.reject();
}

function deleteDocumentFromAlgolia(snapshot: FirebaseFirestore.DocumentSnapshot) {
    if (snapshot.exists) {
        const objectID = snapshot.id;
        return userIndex.deleteObject(objectID);
    }
    return Promise.reject();
}

function isNotNullish<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

function isNullish<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined;
}

function isEqualMembers(oldMembers: string[], members: string[]) {
    if (members.length !== oldMembers.length) {
        return false;
    }
    const memberSet: Set<string> = new Set(members);
    return oldMembers.reduce((acc, member) => acc && memberSet.has(member), true);
}
