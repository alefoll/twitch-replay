import React, { Suspense, memo, useEffect, useState } from "react";
import { useRecoilValue, useRecoilValueLoadable } from "recoil";
import { Info } from "luxon";

import { NoFollow } from "@components/NoFollow";
import { Video, VideoModel } from "@components/Video";

import { getSettings } from "@helpers/settings";
import { getVideosByDay } from "@helpers/video";
import { getWeek } from "@helpers/week";

import "./style.css";

export const SECONDS_IN_DAY = 86400;

export const Calendar = () => {
    const settings = useRecoilValue(getSettings)
    const week     = useRecoilValue(getWeek);

    const loadableVideosByDay = useRecoilValueLoadable(getVideosByDay);

    const [videosByDay, setVideosByDay] = useState<VideoModel[][]>([...Array(7).keys()].map(_ => []));

    useEffect(() => {
        if (loadableVideosByDay.state === "hasValue" && Array.isArray(loadableVideosByDay.contents)) {
            setVideosByDay(loadableVideosByDay.contents);
        }
    }, [loadableVideosByDay]);

    const startOfWeek = week.startOf("week");

    const timeline = [...Array(25).keys()].map((hour) => {
        if (settings.is24Hour) {
            return `${ hour%24 }:00`.padStart(5, "0");
        }

        return `${ hour%12 }${ hour < 12 ? "am" : "pm" }`.padStart(4, "0");
    });

    return (
        <div className="calendar">
            <div className="calendar--week">
                <div className="calendar--time">
                    { timeline.map((hour, index) => <div key={ index }>{ hour }</div>) }
                </div>

                { videosByDay.map((videos, index) => {
                    return <Day
                        key={ index }
                        label={ Info.weekdays("short",  { locale: settings.locale })[index] + '\n' + startOfWeek.plus({ days: index }).toFormat("dd/MM") }
                        timeline={ timeline }
                        videos={ videos }
                    />
                }) }
            </div>

            <Suspense fallback={<></>}>
                <NoFollow />
            </Suspense>
        </div>
    );
}

const Day = memo(({
    label,
    timeline,
    videos,
}: {
    label: string,
    timeline: any[],
    videos: VideoModel[],
}) => {
    const vignetteMarginTopBottom = 6;
    const vignetteHeight = 80 + vignetteMarginTopBottom;

    const { videos: videosWithLineInfo, maxLineIndex } = laConcu(videos);

    return (
        <div className="calendar--line" style={{ minHeight: ((vignetteHeight * maxLineIndex) + vignetteMarginTopBottom) + "px" }}>
            <div className="calendar--line__day">{ label }</div>

            <div className="calendar--line__content">
                { videosWithLineInfo.map(video => {
                    const style: { style: React.CSSProperties } = {
                        style : {
                            left     : ((video.start_in_seconds / SECONDS_IN_DAY) * 100) + "%",
                            width    : ((video.duration_in_seconds / SECONDS_IN_DAY) * 100) + "%",
                            minWidth : ((video.duration_in_seconds / SECONDS_IN_DAY) * 100) + "%",
                            top      : ((vignetteHeight * (video.lineIndex || 0)) + vignetteMarginTopBottom) + "px"
                        }
                    }

                    return (
                        <Suspense key={ video.id }>
                            <Video style={ style.style } video={ video } />
                        </Suspense>
                    );
                })}

                <div className="calendar--line__time">
                    { timeline.map((_, index) => <div key={ index }></div>) }
                </div>
            </div>
        </div>
    );
}, (prev, next) => JSON.stringify(prev.videos) === JSON.stringify(next.videos) && prev.label === next.label);

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
