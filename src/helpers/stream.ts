import { selectorFamily } from "recoil";

import { api } from "@helpers/api";
import { dateToSeconds, durationToNow } from "@helpers/video";

import { VideoApiModel, VideoModel } from "@components/Video";

export const getStreams = selectorFamily<VideoModel[], string[]>({
    key: "getStreams",
    get: ids => async({ get }) => {
        let streams: VideoApiModel[] = [];

        let pagination: string = "";

        do {
            const request = get(api({
                path: `streams?user_id=${ ids.slice(0, 100).join("&user_id=") }&first=100&after=${ pagination }`
            }));

            streams = [...streams, ...request.data];

            // WEIRD: Twitch always return a new pagination to a empty page,
            // so fetch the 2nd page if current livestreams close to "first" params (max 100) and avoid another useless network request
            if (request.data.length >= 99) {
                pagination = request.pagination.cursor || "";
            }
        } while (pagination !== "");

        return streams.map((stream) => {
            const start_in_seconds    = dateToSeconds(stream.started_at!);
            const duration_in_seconds = durationToNow(stream.started_at!);
            const end_in_seconds      = start_in_seconds + duration_in_seconds;

            return {
                ...stream,
                created_at: stream.started_at!,
                start_in_seconds,
                duration_in_seconds,
                end_in_seconds,
            };
        });
    }
});
