import { atom, noWait, selector, selectorFamily, waitForAny } from "recoil";
import { colord } from "colord";

import { api } from "@helpers/api";
import { getStreams } from "@helpers/stream";
import { getVideoByUserID } from "@helpers/video";

import { UserColor, UserFollow, UserModel } from "@components/User";
import { VideoModel } from "@components/Video";

export const USERDATAKEY = "twitch-user-data";

const getCurrentUserId = selector<string>({
    key: "getCurrentUserId",
    get: async ({ get }) => {
        let localData = window.localStorage.getItem(USERDATAKEY);

        if (!localData) {
            const { broadcaster_type, display_name, id, type } = get(getUsers(undefined))[0];

            localData = JSON.stringify({
                broadcaster_type,
                id,
                name: display_name,
                type,
            });

            window.localStorage.setItem(USERDATAKEY, localData);
        }

        const userData = JSON.parse(localData);

        return userData.id;
    },
});

export const getCurrentUserFollow = selector<UserFollow[]>({
    key: "getCurrentUserFollow",
    get: async ({ get }) => {
        const me = get(getCurrentUserId);

        const follows = get(getUserFollows(me));

        get(noWait(getUsersColor(follows.map(_ => _.broadcaster_id))));

        const userFollowsSorted = [...follows].sort((a, b) => a.broadcaster_login.toLocaleLowerCase().localeCompare(b.broadcaster_login.toLocaleLowerCase()));

        return userFollowsSorted;
    }
});

export const getCurrentUserFollowModel = selector<UserModel[]>({
    key: "getCurrentUserFollowModel",
    get: async ({ get }) => {
        const me = get(getCurrentUserId);

        const follows = get(getUserFollows(me));

        const userFollows = get(getUsers(follows.map(_ => _.broadcaster_id)));

        const userFollowsSorted = [...userFollows].sort((a, b) => a.login.toLocaleLowerCase().localeCompare(b.login.toLocaleLowerCase()));

        return userFollowsSorted;
    }
});

export const getCurrentUserFollowFiltered = selector<UserFollow[]>({
    key: "getCurrentUserFollowFiltered",
    get: ({ get }) => {
        const userFollows = get(getCurrentUserFollow);

        const filteredUsers = get(getFilteredUsers);

        if (filteredUsers.length === 0) {
            return userFollows;
        }

        return userFollows.filter((user) =>  filteredUsers.find((filteredUser) => filteredUser.id === user.broadcaster_id));
    }
});

export const getCurrentUserFollowFilteredVideos = selector({
    key: "getCurrentUserFollowFilteredVideos",
    get: async ({ get }) => {
        const userFollows = get(getCurrentUserFollowFiltered);

        const videos = get(waitForAny(
            userFollows.map(user => getVideoByUserID(user.broadcaster_id))
        ));

        const result = videos.reduce((previous, current) => {
            if (current.state === "hasValue") {
                previous = [...previous, ...current.contents];
            }

            return previous;
        }, [] as VideoModel[]);

        return result;
    }
});

export const getCurrentUserFollowLives = selector({
    key: "getCurrentUserFollowLives",
    get: async ({ get }) => {
        const userFollows = get(getCurrentUserFollow);

        const live = get(getStreams(userFollows.map(user => user.broadcaster_id)));

        return live;
    }
});

export const getCurrentUserFollowFilteredLives = selector({
    key: "getCurrentUserFollowFilteredLives",
    get: ({ get }) => {
        const lives = get(getCurrentUserFollowLives);

        const filteredUsers = get(getFilteredUsers);

        if (filteredUsers.length === 0) {
            return lives;
        }

        return lives.filter(live => filteredUsers.find(user => user.id === live.user_id));
    }
});

export const getFilteredUsers = atom<UserModel[]>({
    key: "getFilteredUsers",
    default: [],
});

const userColorAtom = atom<Map<string, UserColor>>({
    key: "userColorAtom",
    default: new Map<string, UserColor>(),
});

export const getUserColor = selectorFamily<UserColor, string>({
    key: "getUserColor",
    get: id => async({ get }) => {
        const atom = get(userColorAtom);

        return atom.get(id) || get(getUsersColor([id]))[0];
    }
});

export const getUsersColor = selectorFamily<UserColor[], string[]>({
    key: "getUsersColor",
    get: ids => async({ get }) => {
        const atom = get(userColorAtom);

        const idsToFetch = ids.filter(id => !atom.has(id));

        if (idsToFetch.length > 0) {
            const query = "?user_id=" + idsToFetch.slice(0, 100).join("&user_id="); // API limit 100

            const colorsRequest = get(api({
                path: `chat/color${ query }`,
            }));

            colorsRequest.data.map((data: { user_id: string, color: string }) => atom.set(data.user_id, {
                value    : data.color,
                contrast : colord(data.color).brightness() >= 0.7,
            }));
        }

        return ids.map(id => {
            if (!atom.has(id)) {
                throw new Error(`No color found for id: ${ id }`);
            }

            return atom.get(id);
        }) as UserColor[];
    }
});

const userAtom = atom<Map<string, UserModel>>({
    key: "userAtom",
    default: new Map<string, UserModel>(),
});

export const getUser = selectorFamily<UserModel, string>({
    key: "getUser",
    get: id => async({ get }) => {
        const atom = get(userAtom);

        return atom.get(id) || get(getUsers([id]))[0];
    }
});

export const getUsers = selectorFamily<UserModel[], string[] | undefined>({
    key: "getUsers",
    get: ids => async({ get }) => {
        const atom = get(userAtom);

        const idsToFetch = ids ? ids.filter(id => !atom.has(id)) : [""];

        if (idsToFetch.length > 0) {
            const query = ids ? "?id=" + idsToFetch.slice(0, 100).join("&id=") : ""; // API limit 100

            const request = get(api({
                path: `users${ query }`,
            }));

            request.data.map((user: UserModel) => atom.set(user.id, user));

            if (!ids) {
                return request.data;
            }
        }

        if (!ids) {
            throw new Error("You're not supposed to be here :thonk:");
        }

        return ids.map(id => {
            if (!atom.has(id)) {
                // NOTE: Don't thow, maybe the user is banned
                // throw new Error(`No user found for id: ${ id }`);
                console.warn(`Unable to found user with id: ${ id }, maybe the user is banned or deleted his account`);
                return;
            }

            return atom.get(id);
        }).filter(Boolean) as UserModel[];
    }
});

export const getUserFollows = selectorFamily<UserFollow[], string>({
    key: "getUserFollows",
    get: id => async({ get }) => {
        let follows: UserFollow[] = [];

        let pagination: string = "";

        do {
            const request = get(api({
                path: `channels/followed?user_id=${ id }&first=100&after=${ pagination }`
            }));

            follows = [...follows, ...request.data];

            pagination = request.pagination.cursor || "";
        } while (pagination !== "");

        return follows;
    }
});
