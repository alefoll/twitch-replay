import React from "react";
import { UserModel } from "@components/User";
import { Video, VideoModel } from "@components/Video";

import "./style.css";
import { DateTime, Duration, Info } from "luxon";

export interface CalendarProps {
    users?: UserModel[];
}

export class Calendar extends React.PureComponent<CalendarProps> {
    static readonly SECONDS_IN_DAY = 86400;
    static readonly TIMEZONE       = "Europe/Paris";

    static readonly durationToPercent = (duration: string): number => {
        const seconds = Calendar.durationToSeconds(duration);

        if (seconds) {
            return (seconds / Calendar.SECONDS_IN_DAY) * 100;
        } else {
            throw new Error(`durationToPercent error : ${ duration }`);
        }
    }

    private readonly durationToPercentRelative = (duration: string, diff: number) => {
        const seconds = Calendar.durationToSeconds(duration);

        if (seconds) {
            return (seconds / diff ) * 100;
        } else {
            throw new Error(`durationToPercent error : ${ duration }`);
        }
    }

    static readonly durationToSeconds = (duration: string): number => {
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

    static readonly dateToPercent = (created: string) => {
        const seconds = Calendar.dateToSeconds(created);

        if (seconds) {
            return (seconds / Calendar.SECONDS_IN_DAY) * 100;
        } else {
            throw new Error(`dateToPercent error : ${ created }`);
        }
    }

    private readonly dateToPercentRelative = (created: string, begin: number) => {
        const seconds = Calendar.dateToSeconds(created);

        if (seconds) {
            return ((seconds - begin) / Calendar.SECONDS_IN_DAY) * 100;
        } else {
            throw new Error(`dateToPercentRelative error : ${ created }`);
        }
    }

    static readonly dateToSeconds = (created: string) => {
        const date = DateTime.fromISO(created).setZone(Calendar.TIMEZONE);

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

    private readonly getVideos = (from: DateTime, to: DateTime) => {
        const users = this.props.users?.filter(user => user.videos?.length);

        const videos = users?.reduce((previous, user) => {
            const filtered = user.videos?.filter((video) => {
                const videoDate = DateTime.fromISO(video.created_at).setZone(Calendar.TIMEZONE);

                return videoDate > from && videoDate < to;
            });

            if (filtered) {
                previous.push(...filtered);
            }

            return previous;
        }, [] as VideoModel[]);

        if (videos) {
            videos.sort((a, b) => a.startInSeconds - b.startInSeconds);
        }

        return videos || [];
    }

    private readonly getVideosByDay = (videos: VideoModel[]) => {
        return videos.reduce((previous, video) => {
            const videoDate = DateTime.fromISO(video.created_at).setZone(Calendar.TIMEZONE);

            previous[videoDate.weekday - 1].push(video);

            return previous;
        }, [...Array(7).keys()].map(_ => [] as VideoModel[]));
    }

    private readonly getMinMaxHours = (videos: VideoModel[]): { start: number, end: number } => {
        if (videos.length) {
            return {
                start : Math.min(Calendar.SECONDS_IN_DAY, ...videos.map(_ => _.startInSeconds)),
                end   : Math.max(0,                       ...videos.map(_ => _.endInSeconds))
            }
        }

        return {
            start: 0,
            end: Calendar.SECONDS_IN_DAY
        }
    }

    private readonly laConcu = (inputVideos: VideoModel[]): VideoModel[] => {
        const videos = [...inputVideos];

        for (let i = 0; i < videos.length; i++) {
            const videoToCheck = videos[i];

            const videosOverlappedStart = [];
            const videosOverlappedEnd   = [];
            const videosOverlappedBoth  = [];
            const videosBeingOverlapped = [];

            for (let j = 0; j < videos.length; j++) {
                if (i !== j) {
                    const video = videos[j];

                    if (
                        (videoToCheck.startInSeconds > video.startInSeconds && videoToCheck.startInSeconds < video.endInSeconds) &&
                        (videoToCheck.endInSeconds   > video.startInSeconds && videoToCheck.endInSeconds   < video.endInSeconds)
                    ) {
                        videosBeingOverlapped.push(video);
                    } else if (videoToCheck.startInSeconds < video.startInSeconds && videoToCheck.endInSeconds > video.endInSeconds) {
                        videosOverlappedBoth.push(video);
                    } else if (videoToCheck.startInSeconds > video.startInSeconds && videoToCheck.startInSeconds < video.endInSeconds) {
                        videosOverlappedStart.push(video);
                    } else if (videoToCheck.endInSeconds > video.startInSeconds && videoToCheck.endInSeconds < video.endInSeconds) {
                        videosOverlappedEnd.push(video);
                    }
                }
            }

            videoToCheck.lineNumber = Math.max(
                videoToCheck.lineNumber,
                1 + Math.max(videosOverlappedStart.length, videosOverlappedEnd.length) + Math.max(videosOverlappedBoth.length, videosBeingOverlapped.length)
            );

            videoToCheck.lineIndex = 0;

            if (videosOverlappedStart.length || videosBeingOverlapped.length) {
                const fusion  = [...videosOverlappedStart, ...videosBeingOverlapped];
                const indexes = fusion.map(_ => _.lineIndex);

                let found = false;

                for (let index = 0; index < fusion.length; index++) {
                    if (!found && !indexes.includes(index)) {
                        found = true;

                        videoToCheck.lineIndex = index;
                    }
                }

                if (!found) {
                    videoToCheck.lineIndex = Math.max(...indexes) + 1;
                }
            }

            for (let index = 0; index < videosOverlappedStart.length; index++) {
                videosOverlappedStart[index].lineNumber = Math.max(videosOverlappedStart[index].lineNumber, videoToCheck.lineNumber);
            }

            for (let index = 0; index < videosOverlappedEnd.length; index++) {
                videosOverlappedEnd[index].lineNumber = Math.max(videosOverlappedEnd[index].lineNumber, videoToCheck.lineNumber);
            }

            for (let index = 0; index < videosOverlappedBoth.length; index++) {
                videosOverlappedBoth[index].lineNumber = Math.max(videosOverlappedBoth[index].lineNumber, videoToCheck.lineNumber);
            }

            for (let index = 0; index < videosBeingOverlapped.length; index++) {
                videosBeingOverlapped[index].lineNumber = Math.max(videosBeingOverlapped[index].lineNumber, videoToCheck.lineNumber);
            }

            // console.log(videoToCheck.lineNumber, videoToCheck, videosOverlappedStart, videosOverlappedEnd, videosOverlappedBoth, videosBeingOverlapped);
        }

        return videos;
    }

    render() {
        // const now = DateTime.local().minus({ days: 2 });
        const now = DateTime.local();

        const startOfWeek = now.startOf("week");
        const endOfWeek   = now.endOf("week");

        const videos = this.getVideos(startOfWeek, endOfWeek);

        const videosByDay = this.getVideosByDay(videos);

        // console.log(videosByDay);

        const { start, end } = this.getMinMaxHours(videos);

        const startHour = Math.floor(start / 3600);
        const endHour   = Math.floor(end   / 3600);

        let hourToShow = [...Array((endHour - startHour) + 1).keys()];

        if (hourToShow.length > 5) {
            const modulus = Math.floor(hourToShow.length / 4);

            hourToShow = hourToShow.map((_, index) => index%modulus === 0 ? _ : -1).filter(_ => _ !== -1);
        }

        // console.log(startHour, endHour, hourToShow);

        return (
            <div className="calendar">
                <div className="calendar--weekpicker">
                    <button>
                        <svg width="16px" height="16px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M13.5 14.5L9 10l4.5-4.5L12 4l-6 6 6 6 1.5-1.5z"></path></g></svg>
                    </button>
                    { startOfWeek.toLocaleString() } – { endOfWeek.toLocaleString() }
                    <button><svg width="16px" height="16px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M6.5 5.5L11 10l-4.5 4.5L8 16l6-6-6-6-1.5 1.5z"></path></g></svg></button>
                </div>

                <div className="calendar--week">
                    <div className="calendar--day">
                        { [...Array(7).keys()].map((day) => {
                            return (
                                <div key={ day } className="calendar--day__element">{ Info.weekdays("short",  { locale: "fr-FR" })[day] }<br/>{ startOfWeek.plus({ day }).toFormat("dd/MM") }</div>
                            );
                        }) }
                    </div>


                    <div className="calendar--content">
                        <div className="calendar--time">
                            { hourToShow.map(hour => <div key={ hour }>{ (startHour + hour)%24 + ":00" }</div>) }
                        </div>

                        { videosByDay.map((videos, dayOfTheWeek) => {
                            const videosWithLineInfo = this.laConcu(videos);

                            return (
                                <div key={ dayOfTheWeek } className="calendar--content__line">
                                    { videosWithLineInfo.map(video => {
                                        const style: { style: React.CSSProperties } = {
                                            style : {
                                                left   : this.dateToPercentRelative(video.created_at, start) + "%",
                                                width  : this.durationToPercentRelative(video.duration, end - start) + "%",
                                                top    : ((100 / video.lineNumber) * video.lineIndex) + "%",
                                                height : `calc(${ 100 / video.lineNumber }% - ${ video.lineIndex === 0 ? 8 : 4 }px)`

                                            }
                                        }

                                        return (
                                            <Video key={ video.id } { ...video } { ...style } />
                                        );
                                    })}
                                </div>
                            );
                        }) }
                    </div>
                </div>
            </div>
        );
    }
}
