import React, { Suspense } from "react";
import { useRecoilValue, useRecoilValueLoadable } from "recoil";
import { Info } from "luxon";

import { NoFollow } from "@components/NoFollow";
import { UserProps } from "@components/User";
import { Video, VideoModel } from "@components/Video";

import { getSettings } from "@helpers/settings";
import { getCurrentUserFollowFiltered } from "@helpers/user";
import { getVideosByDay } from "@helpers/video";
import { getWeek } from "@helpers/week";

import "./style.css";

export const SECONDS_IN_DAY = 86400;

export const Calendar = () => {
    const settings = useRecoilValue(getSettings)
    const week     = useRecoilValue(getWeek);

    const loadableUsers       = useRecoilValueLoadable(getCurrentUserFollowFiltered);
    const loadableVideosByDay = useRecoilValueLoadable(getVideosByDay);

    const startOfWeek = week.startOf("week");

    const vignetteMarginTopBottom = 6;
    const vignetteHeight = 80 + vignetteMarginTopBottom;

    let users: UserProps[] = [];
    let videosByDay: VideoModel[][] = [...Array(7).keys()].map(_ => []);

    if (loadableUsers.state === "hasValue") {
        users = loadableUsers.contents;
    }

    if (loadableVideosByDay.state === "hasValue") {
        videosByDay = loadableVideosByDay.contents;
    }

    if (loadableVideosByDay.state === "hasError") {
        console.log(loadableVideosByDay);
    }

    return (
        <div className="calendar">
            <div className="calendar--week">
                <div className="calendar--time">
                    { [...Array(25).keys()].map(hour => <div key={ hour }>{ (hour%24 + ":00").padStart(5, "0") }</div>) }
                </div>

                { videosByDay.map((videos, index) => {
                    const { videos: videosWithLineInfo, maxLineIndex } = laConcu(videos);

                    return (
                        <div key={ index } className="calendar--line" style={{ minHeight: ((vignetteHeight * maxLineIndex) + vignetteMarginTopBottom) + "px" }}>
                            <div className="calendar--line__day">{ Info.weekdays("short",  { locale: settings.locale })[index] }<br/>{ startOfWeek.plus({ days: index }).toFormat("dd/MM") }</div>

                            <div className="calendar--line__content">
                                <div className="calendar--line__time">
                                    { [...Array(25).keys()].map(hour => <div key={ hour }></div>) }
                                </div>

                                { videosWithLineInfo.map(video => {
                                    const style: { style: React.CSSProperties } = {
                                        style : {
                                            left     : ((video.start_in_seconds / SECONDS_IN_DAY) * 100) + "%",
                                            width    : (((video.end_in_seconds - video.start_in_seconds) / SECONDS_IN_DAY) * 100) + "%",
                                            minWidth : (((video.end_in_seconds - video.start_in_seconds) / SECONDS_IN_DAY) * 100) + "%",
                                            top      : ((vignetteHeight * (video.lineIndex || 0)) + vignetteMarginTopBottom) + "px"
                                        }
                                    }

                                    const user = users.find((user) => user.id === video.user_id);

                                    return (
                                        <Video key={ video.id } style={ style.style } user={ user } video={ video } />
                                    );
                                })}
                            </div>
                        </div>
                    );
                }) }
            </div>

            <Suspense fallback={<></>}>
                <NoFollow />
            </Suspense>
        </div>
    );
}

const isBeetween = (number: number, min: number, max: number) => {
    return number >= min && number < max;
}

const laConcu = (inputVideos: VideoModel[]) => {
    let maxLineIndex = 0;

    const videos: VideoModel[] = [];

    for (let i = 0; i < inputVideos.length; i++) {
        const video = { ...inputVideos[i] };

        for (let j = 0; j < videos.length; j++) {
            const prevVideo = videos[j];

            if (prevVideo.lineIndex === video.lineIndex) {
                if (isBeetween(video.start_in_seconds, prevVideo.start_in_seconds, prevVideo.end_in_seconds)
                    || isBeetween(video.end_in_seconds,   prevVideo.start_in_seconds, prevVideo.end_in_seconds)
                    || (video.start_in_seconds < prevVideo.start_in_seconds && video.end_in_seconds > prevVideo.end_in_seconds)) {
                    video.lineIndex = video.lineIndex || 0;

                    video.lineIndex++;

                    j = 0;

                    if (video.lineIndex > maxLineIndex) {
                        maxLineIndex = video.lineIndex;
                    }
                }
            }
        }

        videos.push(video);
    }

    return {
        videos,
        maxLineIndex: maxLineIndex + 1,
    }
}
