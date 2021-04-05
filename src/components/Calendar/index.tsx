import React from "react";
import { UserProps } from "@components/User";
import { Video, VideoModel } from "@components/Video";
import { DateTime, Info } from "luxon";

import "./style.css";

export interface CalendarProps {
    users?: UserProps[];
}

export interface CalendarState {
    week: number;
}

export class Calendar extends React.PureComponent<CalendarProps, CalendarState> {
    static readonly SECONDS_IN_DAY = 86400;
    static readonly LOCALE         = "fr-FR";
    static readonly TIMEZONE       = "Europe/Paris";

    state = {
        week: 0
    }

    private readonly getVideos = (from: DateTime, to: DateTime) => {
        const users = this.props.users?.filter(user => user.videos?.length);

        const videos = users?.reduce((previous, user) => {
            const filtered = user.videos?.filter((video) => {
                const startDate = DateTime.fromISO(video.created_at).setZone(Calendar.TIMEZONE);
                const endDate   = startDate.plus({ seconds: video.duration_in_seconds });

                return (startDate > from && startDate < to) || (endDate > from && endDate < to) || (startDate < from && endDate > to);
            });

            if (filtered) {
                previous.push(...filtered);
            }

            return previous;
        }, [] as VideoModel[]);

        if (videos) {
            videos.sort((a, b) => a.start_in_seconds - b.start_in_seconds);
        }

        return videos || [];
    }

    private readonly getVideosByDay = (videos: VideoModel[]) => {
        return videos.reduce((previous, video) => {
            const videoDate = DateTime.fromISO(video.created_at).setZone(Calendar.TIMEZONE);

            const yyyymmdd = videoDate.toFormat("yyyyMMdd");

            previous[yyyymmdd] = previous[yyyymmdd] || [];

            previous[yyyymmdd].push(video);

            if (video.end_in_seconds > Calendar.SECONDS_IN_DAY) {
                const nextDay = videoDate.plus({ day: 1 }).toFormat("yyyyMMdd");

                previous[nextDay] = previous[nextDay] || [];

                previous[nextDay].push({
                    ...video,
                    start_in_seconds: video.start_in_seconds - Calendar.SECONDS_IN_DAY,
                    end_in_seconds: video.end_in_seconds - Calendar.SECONDS_IN_DAY,
                    copy: true,
                });
            }

            return previous;
        }, {} as Record<string, VideoModel[]>);
    }

    private readonly getMinMaxHours = (videos: VideoModel[]) => {
        if (videos.length) {
            const start = Math.min(...videos.map(_ => _.end_in_seconds > Calendar.SECONDS_IN_DAY ? 0 : _.start_in_seconds), Calendar.SECONDS_IN_DAY);
            const end   = Math.max(...videos.map(_ => _.end_in_seconds > Calendar.SECONDS_IN_DAY ? Calendar.SECONDS_IN_DAY : _.end_in_seconds), start);

            return { start, end }
        }

        return {
            start: 0,
            end: Calendar.SECONDS_IN_DAY
        }
    }

    private readonly isBeetween = (number: number, min: number, max: number) => {
        return number > min && number < max;
    }

    private readonly laConcu = (inputVideos: VideoModel[]) => {
        let maxLineIndex = 0;

        const videos: VideoModel[] = [];

        for (let i = 0; i < inputVideos.length; i++) {
            const video = {...inputVideos[i]};

            for (let j = 0; j < videos.length; j++) {
                const prevVideo = videos[j];

                if (prevVideo.lineIndex === video.lineIndex) {
                    if (this.isBeetween(video.start_in_seconds, prevVideo.start_in_seconds, prevVideo.end_in_seconds)
                    || this.isBeetween(video.end_in_seconds,   prevVideo.start_in_seconds, prevVideo.end_in_seconds)
                    || (video.start_in_seconds < prevVideo.start_in_seconds && video.end_in_seconds > prevVideo.end_in_seconds)) {
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

    private setWeek = (week: number) => {
        this.setState({
            week
        });
    }

    render() {
        const { week } = this.state;

        let now = DateTime.local().setZone(Calendar.TIMEZONE);

        if (week < 0) {
            now = now.minus({
                week: Math.abs(week)
            });
        }

        if (week > 0) {
            now = now.plus({
                week: week
            });
        }

        const startOfWeek = now.startOf("week");
        const endOfWeek   = now.endOf("week");

        now = now.minus({
            day: 1
        });

        const videos = this.getVideos(startOfWeek, endOfWeek);

        const videosByDay = this.getVideosByDay(videos);

        const { start, end } = this.getMinMaxHours(videos);

        const startHour = Math.floor(start / 3600);
        const endHour   = Math.floor(end   / 3600);

        let hourToShow = [...Array((endHour - startHour) + 1).keys()];

        // if (hourToShow.length > 12) {
        //     hourToShow = hourToShow.filter(hour => hour%2 === 0);
        // }

        const vignetteMarginTopBottom = 6;
        const vignetteHeight = 80 + vignetteMarginTopBottom;

        return (
            <div className="calendar">
                <div className="calendar--weekpicker">
                    <button onClick={ () => this.setWeek(week - 1) }>
                        <svg width="16px" height="16px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M13.5 14.5L9 10l4.5-4.5L12 4l-6 6 6 6 1.5-1.5z" fill="#ffffff"></path></g></svg>
                    </button>
                    { startOfWeek.toFormat("dd/MM") } – { endOfWeek.toFormat("dd/MM") }
                    <button onClick={ () => this.setWeek(week + 1) }>
                        <svg width="16px" height="16px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M6.5 5.5L11 10l-4.5 4.5L8 16l6-6-6-6-1.5 1.5z" fill="#ffffff"></path></g></svg>
                    </button>
                </div>

                <div className="calendar--week">
                    <div className="calendar--time">
                        { hourToShow.map(hour => <div key={ hour }>{ (hour + startHour)%24 + ":00" }</div>) }
                    </div>

                    { [...Array(7).keys()].map((dayOfTheWeek) => {
                        const { videos: videosWithLineInfo, maxLineIndex } = this.laConcu(videosByDay[startOfWeek.plus({ day: dayOfTheWeek }).toFormat("yyyyMMdd")] || []);

                        return (
                            <div key={ dayOfTheWeek } className="calendar--line" style={{ minHeight: ((vignetteHeight * maxLineIndex) + vignetteMarginTopBottom) + "px" }}>
                                <div className="calendar--line__day">{ Info.weekdays("short",  { locale: Calendar.LOCALE })[dayOfTheWeek] }<br/>{ startOfWeek.plus({ day: dayOfTheWeek }).toFormat("dd/MM") }</div>

                                <div className="calendar--line__content">
                                    <div className="calendar--line__time">
                                        { hourToShow.map(hour => <div key={ hour }></div>) }
                                    </div>

                                    { videosWithLineInfo.map(video => {
                                        const style: { style: React.CSSProperties } = {
                                            style : {
                                                left     : (((video.start_in_seconds - start) / (end - start)) * 100) + "%",
                                                width    : (((video.end_in_seconds - video.start_in_seconds) / (end - start)) * 100) + "%",
                                                minWidth : (((video.end_in_seconds - video.start_in_seconds) / (end - start)) * 100) + "%",
                                                top      : ((vignetteHeight * video.lineIndex) + vignetteMarginTopBottom) + "px"
                                            }
                                        }

                                        const user = this.props.users?.find((user) => user.id === video.user_id);

                                        return (
                                            <Video key={ video.id } { ...video } user={ user } { ...style } />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }) }
                </div>
            </div>
        );
    }
}
