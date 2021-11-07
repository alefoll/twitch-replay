import { atom, selector, waitForAny } from "recoil";

import { api } from "@helpers/api";
import { getSettings } from "@helpers/settings";
import { getStreams } from "@helpers/stream";
import { getToken } from "@helpers/token";
import { getVideoByUserID } from "@helpers/video";

import { UserFollow, UserModel, UserProps } from "@components/User";
import { VideoModel } from "@components/Video";

const usersInitialState: UserProps[] = [];

export const usersState = atom({
  key: "usersState",
  default: usersInitialState,
});

export const getCurrentUser = selector({
  key: "getCurrentUser",
  get: async ({ get }) => {
    return (await getUsers(get(getToken)))[0];
  }
});

export const getCurrentUserFollow = selector<UserProps[]>({
    key: "getCurrentUserFollow",
    get: async ({ get }) => {
        const follows = await getUserChannels(get(getToken), get(getCurrentUser));

        const users = await getUsers(get(getToken), follows.map(_ => _.to_id));

        users.sort((a, b) => a.display_name.toLocaleLowerCase().localeCompare(b.display_name.toLocaleLowerCase()));

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

        const colors: { login: string, color: string }[] = require("../../assets/colors.json");

        return users.map((user) => {
            const userProps: UserProps = {
                ...user,
                color: colors.find((_) => _.login === user.login)?.color ?? defaultColors[Math.floor(defaultColors.length * Math.random())],
            }

            return userProps;
        });
    }
});

export const getCurrentUserFollowVideos = selector({
    key: "getCurrentUserFollowVideos",
    get: async ({ get }) => {
        const users = get(getCurrentUserFollow);

        const videos = get(waitForAny(
            users.map(user => getVideoByUserID(user.id))
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
        const settings = get(getSettings);
        const token    = get(getToken);
        const users    = get(getCurrentUserFollow);

        const live = await getStreams(token, users.map(user => user.id), settings.timezone);

        return live;
    }
});

const getUserChannels = async (token: string, user: UserModel, pagination: string = ""): Promise<UserFollow[]> => {
    const request = await api(token, `users/follows?from_id=${ user.id }&after=${ pagination }`);

    const result = request.data;

    if (request.pagination.cursor) {
        const recursive = await getUserChannels(token, user, request.pagination.cursor);

        result.push(...recursive);
    }

    return result;
}

const getUsers = async (token: string, userIDs: string[] = []): Promise<UserModel[]> => {
    let query = "";


    if (userIDs.length) {
        query = "?id=" + userIDs.slice(0, 100).join("&id="); // API limit 100
    }

    const request = await api(token, `users${ query }`);

    return request.data;
}
