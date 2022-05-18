import { atom, selector, selectorFamily, waitForAny } from "recoil";

import { api } from "@helpers/api";
import { getStreams } from "@helpers/stream";
import { getVideoByUserID } from "@helpers/video";

import { UserFollow, UserModel, UserProps } from "@components/User";
import { VideoModel } from "@components/Video";

export const getCurrentUser = selector<UserModel>({
    key: "getCurrentUser",
    get: async ({ get }) => get(getUsers(undefined))[0],
});

export const getCurrentUserFollow = selector<UserProps[]>({
    key: "getCurrentUserFollow",
    get: async ({ get }) => {
        const me = get(getCurrentUser);

        const follows = get(getUserFollows(me.id));

        const userFollows = get(getUsers(follows.map(_ => _.to_id)));

        const userFollowsSorted = [...userFollows].sort((a, b) => a.display_name.toLocaleLowerCase().localeCompare(b.display_name.toLocaleLowerCase()));

        return userFollowsSorted;
    }
});

export const getCurrentUserFollowFiltered = selector<UserProps[]>({
    key: "getCurrentUserFollowFiltered",
    get: ({ get }) => {
        const userFollows = get(getCurrentUserFollow);

        const filteredUsers = get(getFilteredUsers);

        if (filteredUsers.length === 0) {
            return userFollows;
        }

        return userFollows.filter((user) =>  filteredUsers.find((filteredUser) => filteredUser.id === user.id));
    }
});

export const getCurrentUserFollowFilteredVideos = selector({
    key: "getCurrentUserFollowFilteredVideos",
    get: async ({ get }) => {
        const userFollows = get(getCurrentUserFollowFiltered);

        const videos = get(waitForAny(
            userFollows.map(user => getVideoByUserID(user.id))
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

        const live = get(getStreams(userFollows.map(user => user.id)));

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

export const getFilteredUsers = atom<UserProps[]>({
    key: "getFilteredUsers",
    default: [],
});

export const getUsers = selectorFamily<UserProps[], string[] | undefined>({
    key: "getUsers",
    get: ids => async({ get }) => {
        let query = "";

        if (ids && ids.length) {
            query = "?id=" + ids.slice(0, 100).join("&id="); // API limit 100
        }

        const request = get(api({
            path: `users${ query }`,
        }));

        const users = request.data;

        const defaultColors = [
            "#9147ff",
            "#fa1fd1",
            "#8205b5",
            "#00c7b0",
            "#1f69ff",
            "#fab5ff",
            "#fa2929",
            "#57bee6",
            "#bf0078",
            "#fc6675",
            "#40145e",
            "#ff6905",
            "#bfabff",
            "#ffc95e",
            "#0014a6",
        ]

        return users.map((user: UserModel) => {
            return {
                ...user,
                color: defaultColors[Math.floor(defaultColors.length * Math.random())],
            }
        });

    }
});

export const getUserFollows = selectorFamily<UserFollow[], string>({
    key: "getUserFollows",
    get: id => async({ get }) => {
        let follows: UserFollow[] = [];

        let pagination: string = "";

        do {
            const request = get(api({
                path: `users/follows?from_id=${ id }&first=100&after=${ pagination }`
            }));

            follows = [...follows, ...request.data];

            pagination = request.pagination.cursor || "";
        } while (pagination !== "");

        return follows;
    }
});
