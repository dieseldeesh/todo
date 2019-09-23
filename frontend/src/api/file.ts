import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/functions";
import { TaskStatus, TaskDifficulty, TaskImportance } from "../state";
import { sortBy, noop } from "lodash-es";
import { NullableValue } from "../common/nullableValue";
import { IFirebaseConfig, initializeFirebase, EntityWithId, Callback, Cancelable } from "../common/firebase";
import moment from "moment";

export enum FileType {
    PROJECT = "project",
    TASK = "task",
}

interface ICommonProps {
    title: string;
    description: string;
    members: string[];
    parentProjectId: string | null;
    type: FileType;
}

interface ICommonProjectProps extends ICommonProps {
    type: FileType.PROJECT;
}

export interface IProject extends ICommonProjectProps {
    modifiedAt?: Date;
}

interface IEncodedProject extends ICommonProjectProps {
    modifiedAt: firebase.firestore.Timestamp;
}

interface ICommonTaskProps extends ICommonProps {
    lastModifiedBy: string;
    assignee: string;
    dependencies: string[];
    parentProjectId: string;
    type: FileType.TASK;
}

export interface ITask extends ICommonTaskProps {
    status: TaskStatus;
    difficulty: TaskDifficulty | null;
    importance: TaskImportance | null;
    dueDate: Date | null;
    modifiedAt?: Date;
}

interface IEncodedTask extends ICommonTaskProps {
    status: number;
    difficulty: number | null;
    importance: number | null;
    dueDate: number | null;
    modifiedAt: firebase.firestore.Timestamp;
}

export interface IFileService {
    createTask(task: ITask): Promise<string>;
    editTask(taskId: string, task: ITask): Promise<void>;
    deleteTask(taskId: string): Promise<void>;
    getTask(taskId: string, callback: Callback<NullableValue<EntityWithId<ITask>>>): Cancelable;
    listIncompleteTasksForCurrentUser(callback: Callback<Array<EntityWithId<ITask>>>): Promise<Cancelable>;
    listCompletedTasksForCurrentUser(callback: Callback<Array<EntityWithId<ITask>>>): Promise<Cancelable>;
    listIncompleteTasksForProject(
        projectId: string,
        callback: Callback<Array<EntityWithId<ITask>>>,
    ): Promise<Cancelable>;
    listCompletedTasksForProject(
        projectId: string,
        callback: Callback<Array<EntityWithId<ITask>>>,
    ): Promise<Cancelable>;
    createProject(project: IProject): Promise<string>;
    editProject(projectId: string, project: IProject): Promise<void>;
    deleteProject(projectId: string): Promise<void>;
    getProject(projectId: string, callback: Callback<NullableValue<EntityWithId<IProject>>>): Cancelable;
    getProjects(projectId: string | null, callback: Callback<Array<EntityWithId<IProject>>>): Promise<Cancelable>;
}

export class FileService implements IFileService {
    private static TASK_STATUS_VALUES: Record<TaskStatus, number> = {
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.BLOCKED]: 1,
        [TaskStatus.IN_PROGRESS]: 2,
        [TaskStatus.NOT_STARTED]: 3,
    };

    private static TASK_DIFFICULTY_VALUES: Record<TaskDifficulty, number> = {
        [TaskDifficulty.EASY]: 0,
        [TaskDifficulty.MEDIUM]: 1,
        [TaskDifficulty.HARD]: 2,
    };

    private static TASK_IMPORTANCE_VALUES: Record<TaskImportance, number> = {
        [TaskImportance.P0]: 0,
        [TaskImportance.P1]: 1,
        [TaskImportance.P2]: 2,
        [TaskImportance.P3]: 3,
        [TaskImportance.P4]: 4,
    };

    private static ORDERED_TASK_STATUSES = sortBy(
        Object.keys(FileService.TASK_STATUS_VALUES) as TaskStatus[],
        status => FileService.TASK_STATUS_VALUES[status],
    );

    private static ORDERED_TASK_DIFFICULTIES = sortBy(
        Object.keys(FileService.TASK_DIFFICULTY_VALUES) as TaskDifficulty[],
        status => FileService.TASK_DIFFICULTY_VALUES[status],
    );

    private static ORDERED_TASK_IMPORTANCES = sortBy(
        Object.keys(FileService.TASK_IMPORTANCE_VALUES) as TaskImportance[],
        status => FileService.TASK_IMPORTANCE_VALUES[status],
    );

    private static FILES_COLLECTION = "files";

    private filesCollection: firebase.firestore.CollectionReference;
    private saveFunction: firebase.functions.HttpsCallable;

    public constructor(firebaseConfig: IFirebaseConfig) {
        initializeFirebase(firebaseConfig);
        this.filesCollection = firebase.firestore().collection(FileService.FILES_COLLECTION);
        this.saveFunction = firebase.functions().httpsCallable("saveFile");
    }

    public createTask(task: ITask): Promise<string> {
        return this.saveFunction({ fileId: null, file: this.encodeTask(task) }).then(result => result.data);
    }

    public editTask(taskId: string, task: ITask): Promise<void> {
        return this.saveFunction({ fileId: taskId, file: this.encodeTask(task) }).then(noop);
    }

    public getTask(taskId: string, callback: Callback<NullableValue<EntityWithId<ITask>>>): Cancelable {
        return this.filesCollection.doc(taskId).onSnapshot(doc =>
            callback(
                NullableValue.of(doc.data() as IEncodedTask | undefined).map(data => {
                    return this.decodeTask({ ...data, id: taskId });
                }),
            ),
        );
    }

    public deleteTask(taskId: string): Promise<void> {
        return this.filesCollection.doc(taskId).delete();
    }

    public async listIncompleteTasksForCurrentUser(
        callback: Callback<Array<EntityWithId<ITask>>>,
    ): Promise<Cancelable> {
        const user = await this.getValidUser();
        return this.filesCollection
            .where("members", "array-contains", user.uid)
            .where("status", ">", 0)
            .where("type", "==", FileType.TASK)
            .where("assignee", "==", user.uid)
            .orderBy("status")
            .orderBy("modifiedAt")
            .onSnapshot(snapshot => callback(this.decodeTaskDocuments(snapshot.docs)));
    }

    public async listCompletedTasksForCurrentUser(callback: Callback<Array<EntityWithId<ITask>>>): Promise<Cancelable> {
        const user = await this.getValidUser();
        return this.filesCollection
            .where("members", "array-contains", user.uid)
            .where("status", "==", 0)
            .where("type", "==", FileType.TASK)
            .where("assignee", "==", user.uid)
            .orderBy("modifiedAt")
            .onSnapshot(snapshot => callback(this.decodeTaskDocuments(snapshot.docs)));
    }

    public async listIncompleteTasksForProject(
        projectId: string,
        callback: Callback<Array<EntityWithId<ITask>>>,
    ): Promise<Cancelable> {
        const user = await this.getValidUser();
        return this.filesCollection
            .where("members", "array-contains", user.uid)
            .where("status", ">", 0)
            .where("type", "==", FileType.TASK)
            .where("parentProjectId", "==", projectId)
            .orderBy("status")
            .orderBy("modifiedAt")
            .onSnapshot(snapshot => callback(this.decodeTaskDocuments(snapshot.docs)));
    }

    public async listCompletedTasksForProject(
        projectId: string,
        callback: Callback<Array<EntityWithId<ITask>>>,
    ): Promise<Cancelable> {
        const user = await this.getValidUser();
        return this.filesCollection
            .where("members", "array-contains", user.uid)
            .where("status", "==", 0)
            .where("type", "==", FileType.TASK)
            .where("parentProjectId", "==", projectId)
            .orderBy("modifiedAt")
            .onSnapshot(snapshot => callback(this.decodeTaskDocuments(snapshot.docs)));
    }

    public createProject(project: IProject): Promise<string> {
        return this.saveFunction({ fileId: null, file: this.encodeProject(project) }).then(result => result.data);
    }

    public editProject(projectId: string, project: IProject): Promise<void> {
        return this.saveFunction({ fileId: projectId, file: this.encodeProject(project) }).then(noop);
    }

    public deleteProject(projectId: string): Promise<void> {
        return this.filesCollection.doc(projectId).delete();
    }

    public getProject(projectId: string, callback: Callback<NullableValue<EntityWithId<IProject>>>): Cancelable {
        return this.filesCollection
            .doc(projectId)
            .onSnapshot(doc =>
                callback(
                    NullableValue.of(doc.data() as IProject | undefined).map(data => ({ ...data, id: projectId })),
                ),
            );
    }

    public async getProjects(
        projectId: string | null,
        callback: Callback<Array<EntityWithId<IProject>>>,
    ): Promise<Cancelable> {
        const user = await this.getValidUser();
        return this.filesCollection
            .where("members", "array-contains", user.uid)
            .where("type", "==", FileType.PROJECT)
            .where("parentProjectId", "==", projectId)
            .orderBy("modifiedAt")
            .onSnapshot(snapshot => callback(this.decodeProjectDocuments(snapshot.docs)));
    }

    private encodeTask(task: ITask): IEncodedTask {
        const { dueDate, status, difficulty, importance, ...rest } = task;
        return {
            ...rest,
            dueDate: NullableValue.of(dueDate)
                .map(date => moment(date).valueOf())
                .getOrNull(),
            modifiedAt: firebase.firestore.Timestamp.fromDate(new Date()),
            status: FileService.TASK_STATUS_VALUES[task.status],
            difficulty: NullableValue.of(difficulty)
                .map(taskDifficult => FileService.TASK_DIFFICULTY_VALUES[taskDifficult])
                .getOrNull(),
            importance: NullableValue.of(importance)
                .map(taskImportance => FileService.TASK_IMPORTANCE_VALUES[taskImportance])
                .getOrNull(),
        };
    }

    private encodeProject(project: IProject): IEncodedProject {
        return {
            ...project,
            modifiedAt: firebase.firestore.Timestamp.fromDate(new Date()),
        };
    }

    private decodeTask(task: EntityWithId<IEncodedTask>): EntityWithId<ITask> {
        const { dueDate, status, difficulty, importance, modifiedAt, ...rest } = task;
        return {
            ...rest,
            dueDate: NullableValue.of(dueDate)
                .map(date => moment(date).toDate())
                .getOrNull(),
            modifiedAt: modifiedAt.toDate(),
            status: FileService.ORDERED_TASK_STATUSES[task.status],
            difficulty: NullableValue.of(difficulty)
                .map(taskDifficulty => FileService.ORDERED_TASK_DIFFICULTIES[taskDifficulty])
                .getOrNull(),
            importance: NullableValue.of(importance)
                .map(taskImportance => FileService.ORDERED_TASK_IMPORTANCES[taskImportance])
                .getOrNull(),
        };
    }

    private decodeProject(project: EntityWithId<IEncodedProject>): EntityWithId<IProject> {
        const { modifiedAt, ...rest } = project;
        return {
            ...rest,
            modifiedAt: modifiedAt.toDate(),
        };
    }

    private decodeTaskDocuments(documents: firebase.firestore.QueryDocumentSnapshot[]) {
        return documents.map(document => {
            const data = document.data() as IEncodedTask;
            return this.decodeTask({ ...data, id: document.id });
        });
    }

    private decodeProjectDocuments(documents: firebase.firestore.QueryDocumentSnapshot[]) {
        return documents.map(document => {
            const data = document.data() as IEncodedProject;
            return this.decodeProject({ ...data, id: document.id });
        });
    }

    private getCurrentUser() {
        return new Promise<firebase.User | null>((resolve, reject) => {
            const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            }, reject);
        });
    }

    private getValidUser() {
        return new Promise<firebase.User>(async (resolve, reject) => {
            let user: firebase.User | null = null;
            while (user == null) {
                user = await this.getCurrentUser().catch(error => {
                    reject(error);
                    return null;
                });
            }
            resolve(user);
        });
    }
}
