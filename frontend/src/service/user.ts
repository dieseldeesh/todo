import { Store } from "redux";
import { IApplicationState, SetCurrentUser, SetSearchedUsers, AddFetchedUsers } from "../state";
import { IUserService, IUserProfile, ISearchService, IPhotoService, ISearchedUser } from "../api";
import { Map } from "immutable";
import { AsyncLoadedValue } from "../common/redoodle";
import { CompoundAction } from "redoodle";
import { SetCurrentUserPhotoUrl } from "../state/actions";

export class UserService {
    constructor(
        private store: Store<IApplicationState>,
        private userService: IUserService,
        private searchService: ISearchService,
        private photoService: IPhotoService,
    ) {
        userService.onAuthStateChanged(user => {
            const maybeUser = user.getOrNull();
            if (maybeUser == null) {
                this.store.dispatch(
                    CompoundAction.create([
                        SetCurrentUser.Success.create(maybeUser),
                        SetCurrentUserPhotoUrl.Success.create(null),
                    ]),
                );
            } else {
                this.store.dispatch(
                    CompoundAction.create([
                        SetCurrentUser.Success.create(maybeUser),
                        SetCurrentUserPhotoUrl.Success.create(null),
                    ]),
                );
                userService.onUserUpdate(maybeUser.uid, nullableUser => {
                    const user = nullableUser.getOrNull();
                    if (user != null && user.photoURL != null) {
                        photoService.getProfilePicture(user.photoURL).then(url => {
                            this.store.dispatch(
                                CompoundAction.create([
                                    SetCurrentUser.Success.create(maybeUser),
                                    SetCurrentUserPhotoUrl.Success.create(url),
                                ]),
                            );
                        });
                    }
                });
            }
        });
    }

    public signUp(email: string, password: string) {
        return this.userService.signUp(email, password);
    }

    public signIn(email: string, password: string) {
        return this.userService.signIn(email, password);
    }

    public signOut() {
        return this.userService.signOut();
    }

    public updateCurrentUser(userProfile: IUserProfile) {
        return this.userService.updateCurrentUser(userProfile);
    }

    public deleteCurrentUser() {
        return this.userService.deleteCurrentUser();
    }

    public searchUsers(query: string) {
        this.store.dispatch(SetSearchedUsers.InProgress.create(undefined));
        this.searchService.searchUsers(query).then(users => {
            this.store.dispatch(SetSearchedUsers.Success.create(users));
        });
    }

    public fetchUsers(userIds: string[]) {
        const loadingUsersMap = Map(userIds.map(userId => [userId, AsyncLoadedValue.asyncLoading()]));
        this.store.dispatch(AddFetchedUsers.create(loadingUsersMap));
        return this.searchService.getUsers(userIds).then(users => {
            this.store.dispatch(AddFetchedUsers.create(this.createLoadedUsersMap(users)));
            Promise.all(
                users.map(user =>
                    user.photoURL == null
                        ? Promise.resolve(user)
                        : this.photoService.getProfilePicture(user.photoURL).then(url => ({ ...user, photoURL: url })),
                ),
            ).then(users => {
                this.store.dispatch(AddFetchedUsers.create(this.createLoadedUsersMap(users)));
            });
        });
    }

    private createLoadedUsersMap(users: ISearchedUser[]) {
        return Map(users.map(user => [user.id, AsyncLoadedValue.asyncLoadingSucceeded(user)]));
    }
}
