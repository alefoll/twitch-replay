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

    private readonly laConcu = (videos: VideoModel[], videoIndex: number): { nb: number, index: number } => {
        const result = {
            nb    : 1,
            index : 0
        }

        let found = false;

        const videoToCheck = videos[videoIndex];

        const videosOverlappedStart = [];
        const videosOverlappedEnd   = [];
        const videosOverlappedBoth  = [];

        for (let index = 0; index < videos.length; index++) {
            const video = videos[index];

            if (video !== videoToCheck) {
                if ((
                    (videoToCheck.startInSeconds > video.startInSeconds && videoToCheck.startInSeconds < video.endInSeconds) &&
                    (videoToCheck.endInSeconds   > video.startInSeconds && videoToCheck.endInSeconds   < video.endInSeconds)
                ) || (
                    (videoToCheck.startInSeconds < video.startInSeconds && videoToCheck.startInSeconds < video.endInSeconds) &&
                    (videoToCheck.endInSeconds   > video.startInSeconds && videoToCheck.endInSeconds   > video.endInSeconds)
                )) {
                    videosOverlappedBoth.push(video);

                    if (!found) {
                        result.index++;
                    }
                } else if (videoToCheck.startInSeconds > video.startInSeconds && videoToCheck.startInSeconds < video.endInSeconds) {
                    videosOverlappedStart.push(video);

                    if (!found) {
                        result.index++;
                    }
                } else if (videoToCheck.endInSeconds > video.startInSeconds && videoToCheck.endInSeconds < video.endInSeconds) {
                    videosOverlappedEnd.push(video);

                    if (!found) {
                        result.index++;
                    }
                }
            } else {
                found = true;
            }
        }

        result.nb += videosOverlappedStart.length + videosOverlappedEnd.length + videosOverlappedBoth.length;

        // console.log(videoToCheck, videosOverlappedStart, videosOverlappedEnd, videosOverlappedBoth);

        // console.log(result);

        return result;
    }

    render() {
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
                {/* <div>{ startOfWeek.toLocaleString() } – { endOfWeek.toLocaleString() }</div> */}

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
                            return (
                                <div key={ dayOfTheWeek } className="calendar--content__line">
                                    { videos.map((video, videoIndex) => {
                                        const { nb, index } = this.laConcu(videos, videoIndex);
                                        // console.log({ dayOfTheWeek, nb, index });

                                        const style: { style: React.CSSProperties } = {
                                            style : {
                                                left   : this.dateToPercentRelative(video.created_at, start) + "%",
                                                width  : this.durationToPercentRelative(video.duration, end - start) + "%",
                                                top    : ((100 / nb) * index) + "%",
                                                height : `calc(${ 100 / nb }% - ${ nb > 1 ? 4 : 8 }px)`,
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
