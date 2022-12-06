import { selector, selectorFamily } from "recoil";
import { DateTime, Duration } from "luxon";

import { api } from "@helpers/api";
import { getSettings } from "@helpers/settings";
import { getCurrentUserFollowFiltered, getCurrentUserFollowFilteredLives, getCurrentUserFollowFilteredVideos } from "@helpers/user";
import { getWeek } from "@helpers/week";

import { VideoApiModel, VideoModel } from "@components/Video";

const SECONDS_IN_DAY = 86400;

export const getVideosByWeek = selector({
    key: "getVideosByWeek",
    get: async({ get }) => {
        const settings = get(getSettings);
        const users    = get(getCurrentUserFollowFiltered);
        const videos   = get(getCurrentUserFollowFilteredVideos);
        const week     = get(getWeek);

        const startOfWeek = week.startOf("week");
        const endOfWeek   = week.endOf("week");

        const timezoneOffset = DateTime.local().setZone(settings.timezone).offset * 60;

        const filter = videos.filter((video) => {
            const startDate = DateTime.fromISO(video.created_at).setZone("utc").plus({ seconds: timezoneOffset });
            const endDate   = startDate.plus({ seconds: video.duration_in_seconds });

            return (startOfWeek < startDate && startDate < endOfWeek)
                || (startOfWeek < endDate   && endDate   < endOfWeek)
                || (startDate < startOfWeek && endDate   > endOfWeek);
        });

        const currentDate = DateTime.local().setZone("utc");

        if (startOfWeek < currentDate && currentDate < endOfWeek) {
            const lives = get(getCurrentUserFollowFilteredLives);

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
        const settings = get(getSettings);
        const videos   = get(getVideosByWeek);
        const week     = get(getWeek);

        const timezoneOffset = DateTime.local().setZone(settings.timezone).offset * 60;

        const startOfWeek = week.startOf("week");

        const result: VideoModel[][] = [...Array(7).keys()].map(_ => []);

        videos.map((video) => {
            let mutableVideo: VideoModel = {
                ...video,
                start_in_seconds : video.start_in_seconds + timezoneOffset,
                end_in_seconds   : video.end_in_seconds   + timezoneOffset,
            };

            const startDate = DateTime.fromISO(mutableVideo.created_at).setZone("utc").plus({ seconds: timezoneOffset });

            // weekday start at 1
            let weekday = startDate.weekday - 1;

            if (startDate < startOfWeek) {
                weekday = 0;

                const diff = Math.ceil(startOfWeek.diff(startDate, "days").days) * SECONDS_IN_DAY;

                mutableVideo = {
                    ...mutableVideo,
                    start_in_seconds : mutableVideo.start_in_seconds - diff,
                    end_in_seconds   : mutableVideo.end_in_seconds   - diff,
                }
            }

            if (mutableVideo.start_in_seconds < SECONDS_IN_DAY) {
                result[weekday].push({ ...mutableVideo });
            }

            while (mutableVideo.end_in_seconds > SECONDS_IN_DAY) {
                mutableVideo = {
                    ...mutableVideo,
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
    get: (userID: string) => async ({ get }) => get(getVideos(userID)),
});

export const getVideos = selectorFamily<VideoModel[], string>({
    key: "getVideos",
    get: id => async({ get }) => {
        let videos: VideoApiModel[] = [];

        let pagination: string = "";

        do {
            const request = get(api({
                path: `videos?user_id=${ id }&after=${ pagination }&first=100&type=archive`
            }));

            const data: VideoApiModel[] = request.data.filter((video: VideoApiModel) => video.thumbnail_url !== "");

            videos = [...videos, ...data];

            // pagination = request.pagination.cursor || "";
        } while (pagination !== "");

        return videos.map((video) => {
            const start_in_seconds    = dateToSeconds(video.created_at);
            const duration_in_seconds = durationToSeconds(video.duration!);
            const end_in_seconds      = start_in_seconds + duration_in_seconds;

            if (video.thumbnail_url.includes("404_processing_")) {
                return;
            }

            return {
                ...video,
                start_in_seconds,
                duration_in_seconds,
                end_in_seconds,
            }
        }).filter(item => item) as VideoModel[];
    }
});

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

export const durationToNow = (started_at: string): number => {
    const start = DateTime.fromISO(started_at).setZone("utc");
    const now   = DateTime.local().setZone("utc");

    const { seconds } = now.diff(start, "seconds");

    if (seconds) {
        return seconds;
    } else {
        throw new Error(`durationToNow error : ${ started_at }`);
    }
}

export const dateToSeconds = (created: string) => {
    const date = DateTime.fromISO(created).setZone("utc");

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
