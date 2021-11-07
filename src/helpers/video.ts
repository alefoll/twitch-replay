import { selector, selectorFamily } from "recoil";
import { DateTime, Duration } from "luxon";

import { api } from "@helpers/api";
import { getSettings } from "@helpers/settings";
import { getToken } from "@helpers/token";
import { getCurrentUserFollow, getCurrentUserFollowLives, getCurrentUserFollowVideos } from "@helpers/user";
import { getWeek } from "@helpers/week";

import { VideoApiModel, VideoModel } from "@components/Video";

const SECONDS_IN_DAY = 86400;

export const getVideosByWeek = selector({
    key: "getVideosByWeek",
    get: async({ get }) => {
        const timezone = get(getSettings).timezone;
        const users    = get(getCurrentUserFollow);
        const videos   = get(getCurrentUserFollowVideos);
        const week     = get(getWeek);

        const startOfWeek = week.startOf("week");
        const endOfWeek   = week.endOf("week");

        const filter = videos.filter((video) => {
            const startDate = DateTime.fromISO(video.created_at).setZone(timezone);
            const endDate   = startDate.plus({ seconds: video.duration_in_seconds });

            return (startDate > startOfWeek && startDate < endOfWeek)
                || (endDate   > startOfWeek && endDate   < endOfWeek)
                || (startDate < startOfWeek && endDate   > endOfWeek);
        });

        const currentDate = DateTime.now();

        if (startOfWeek < currentDate && currentDate < endOfWeek) {
            const lives = get(getCurrentUserFollowLives);

            lives.map((live) => {
                const user = users.find(user => user.id === live.user_id);

                if (!user) {
                    throw new Error;
                }

                filter.push({
                    ...live,
                    url: `https://www.twitch.tv/${ user.login }`
                });

            });
        }

        return filter.sort((a, b) => a.start_in_seconds - b.start_in_seconds);
    },
});

export const getVideosByDay = selector({
    key: "getVideosByDay",
    get: ({ get }) => {
        const timezone = get(getSettings).timezone;
        const videos   = get(getVideosByWeek);
        const week     = get(getWeek);

        const startOfWeek = week.startOf("week");

        const result: VideoModel[][] = [...Array(7).keys()].map(_ => []);

        videos.map((video) => {
            const startDate = DateTime.fromISO(video.created_at).setZone(timezone);

            let weekday = startDate.weekday - 1;

            let mutableVideo: VideoModel = { ...video };

            if (startDate < startOfWeek) {
                weekday = 0;

                const diff = Math.ceil(startOfWeek.diff(startDate, "days").days) * SECONDS_IN_DAY;

                mutableVideo = {
                    ...mutableVideo,
                    start_in_seconds : mutableVideo.start_in_seconds - diff,
                    end_in_seconds   : mutableVideo.end_in_seconds   - diff,
                }
            }

            result[weekday].push({ ...mutableVideo });

            while (mutableVideo.end_in_seconds > SECONDS_IN_DAY) {
                mutableVideo = {
                    ...mutableVideo,
                    copy             : true,
                    start_in_seconds : mutableVideo.start_in_seconds - SECONDS_IN_DAY,
                    end_in_seconds   : mutableVideo.end_in_seconds   - SECONDS_IN_DAY,
                }

                weekday++;

                if (weekday < 7) {
                    result[weekday].push({ ...mutableVideo });
                }
            }
        });

        return result;
    },
});

export const getVideoByUserID = selectorFamily({
    key: "getVideoByUserID",
    get: (userID: string) => async ({ get }) => (await getVideos(get(getToken), userID, get(getSettings).timezone)).videos,
});

export const getVideos = async (token: string, userID: string, timezone: string, pagination: string = ""): Promise<{ videos: VideoModel[], pagination: string }> => {
    const request = await api(token, `videos?user_id=${ userID }&after=${ pagination }&first=100&type=archive`);

    let data: VideoApiModel[] = request.data;

    data = data.filter((video) => video.thumbnail_url !== "");

    const videos: VideoModel[] = data.map((video) => {
        const start_in_seconds    = dateToSeconds(video.created_at, timezone);
        const duration_in_seconds = durationToSeconds(video.duration!);
        const end_in_seconds      = start_in_seconds + duration_in_seconds;

        return {
            ...video,
            start_in_seconds,
            duration_in_seconds,
            end_in_seconds,
        }
    });

    return {
        videos,
        pagination: request.pagination,
    };
}

export const durationToSeconds = (duration: string): number => {
    const parser = /(?:(?:(\d*)h)?(\d*)m)?(\d*)s/.exec(duration);

    if (parser?.length !== 4) {
        throw new Error(`Parser error : ${ duration }`);
    }

    const [, hour, minute, second] = parser;

    const durationn = Duration.fromObject({
        hours   : hour   ? parseInt(hour)   : 0,
        minutes : minute ? parseInt(minute) : 0,
        seconds : second ? parseInt(second) : 0
    });

    const { seconds } = durationn.shiftTo("seconds").toObject();

    if (seconds) {
        return seconds;
    } else {
        throw new Error(`durationToSeconds error : ${ duration }`);
    }
}

export const durationToNow = (started_at: string, timezone: string): number => {
    const start = DateTime.fromISO(started_at).setZone(timezone);
    const now   = DateTime.now().setZone(timezone);

    const { seconds } = now.diff(start, "seconds");

    if (seconds) {
        return seconds;
    } else {
        throw new Error(`durationToNow error : ${ started_at }`);
    }
}

export const dateToSeconds = (created: string, timezone: string) => {
    const date = DateTime.fromISO(created).setZone(timezone);

    const duration = Duration.fromObject({
        hours   : date.hour,
        minutes : date.minute,
        seconds : date.second
    });

    const { seconds } = duration.shiftTo("seconds").toObject();

    if (seconds) {
        return seconds;
    } else {
        throw new Error(`dateToSeconds error : ${ created }`);
    }
}
