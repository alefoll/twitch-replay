import { api } from "@helpers/api";

import { dateToSeconds, durationToNow } from "@helpers/video";

import { VideoApiModel, VideoModel } from "@components/Video";

export const getStreams = async (token: string, userIDs: string[], timezone: string, pagination: string = ""): Promise<VideoModel[]> => {
    const request = await api(token, `streams?user_id=${ userIDs.slice(0, 100).join("&user_id=") }&after=${ pagination }`);

    const streams: VideoApiModel[] = request.data;

    if (request.pagination.cursor) {
        const recursive = await getStreams(token, userIDs.slice(100, 200), timezone, request.pagination.cursor);

        streams.push(...recursive);
    }

    return streams.map((stream) => {
        const start_in_seconds    = dateToSeconds(stream.started_at!, timezone);
        const duration_in_seconds = durationToNow(stream.started_at!, timezone);
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
