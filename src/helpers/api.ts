import { selectorFamily } from "recoil";

import { getToken } from "@helpers/token";

export const CLIENTID = "gvmbg22kqruvfibmxm4dm5datn9yis";

type TwitchApiParam = {
    path: string,
}

export const api = selectorFamily<any, TwitchApiParam>({
    key: "api",
    get: (param) => async({ get }) => {
        const token = get(getToken);

        const { path } = param;

        const request = await fetch(`https://api.twitch.tv/helix/${ path }`, {
            headers: {
                "Authorization" : `Bearer ${ token }`,
                "Client-Id"     : CLIENTID,
            }
        });

        if ((request.status < 200 || request.status > 299) && request.status !== 404)  {
            throw new Error("Twitch API error");
        }

        return request.json();
    }
});
