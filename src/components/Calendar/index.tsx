import React from "react";
import { UserModel } from "@components/User";
import { Video, VideoMetadata, VideoModel } from "@components/Video";
import { DateTime, Info } from "luxon";

import "./style.css";

export interface CalendarProps {
    users?: UserModel[];
}

export interface CalendarState {
    week: number;
}

export class Calendar extends React.PureComponent<CalendarProps, CalendarState> {
    static readonly SECONDS_IN_DAY = 86400;
    static readonly LOCALE         = "fr-FR";
    static readonly TIMEZONE       = "Europe/Paris";

    state = {
        // week: -1
        week: 0
    }

    private readonly getVideos = (from: DateTime, to: DateTime): VideoModel[] => {
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
            videos.sort((a, b) => a.start_in_seconds - b.start_in_seconds);
        }

        return videos || [];

        // return [{
        //     start: 50_000,  // 1
        //     end: 70_000
        // }, {
        //     start: 55_000,  // 2
        //     end: 71_000
        // }, {
        //     start: 50_500,  // 3
        //     end: 72_000
        // }, {
        //     start: 40_000,  // 4
        //     end: 75_000
        // }, {
        //     start: 60_000,  // 5
        //     end: 61_000
        // }, {
        //     start: 80_000,  // 6
        //     end: 81_000
        // }, {
        //     start: 45_000,  // 7
        //     end: 78_000
        // }, {
        //     start: 41_000,  // 8
        //     end: 50_000
        // }, {
        //     start: 43_000,  // 9
        //     end: 53_000
        // }].map((_, index) => {
        //     return {
        //         copy: false,
        //         created_at: "2021-03-08T12:56:05Z",
        //         description: "",
        //         duration: "5h44m54s",
        //         start_in_seconds: _.start,
        //         end_in_seconds: _.end,
        //         id: index.toString(),
        //         language: "fr",
        //         lineIndex: 0,
        //         overlap: 0,
        //         published_at: "2021-03-08T12:56:05Z",
        //         thumbnail_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
        //         title: `${ index }eer Video - ${ index }e`,
        //         type: "archive",
        //         url: "https://www.twitch.tv/videos/901834920",
        //         user_id: "40063341",
        //         user_login: "domingo",
        //         user_name: "Domingo",
        //         view_count: 167673,
        //         viewable: "public",
        //     }
        // });
    }

    private readonly getVideosByDay = (videos: VideoModel[]): VideoModel[][] => {
        return videos.reduce((previous, video) => {
            const videoDate = DateTime.fromISO(video.created_at).setZone(Calendar.TIMEZONE);

            previous[videoDate.weekday - 1].push(video);

            if (video.end_in_seconds > Calendar.SECONDS_IN_DAY && videoDate.weekday < 6) {
                previous[videoDate.weekday].push({
                    ...video,
                    start_in_seconds: video.start_in_seconds - Calendar.SECONDS_IN_DAY,
                    end_in_seconds: video.end_in_seconds - Calendar.SECONDS_IN_DAY,
                    copy: true,
                });
            }

            return previous;
        }, [...Array(7).keys()].map(_ => [] as VideoModel[]));
    }

    private readonly getMinMaxHours = (videos: VideoModel[]): { start: number, end: number } => {
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

    private readonly isBeetween = (number: number, min: number, max: number): boolean => {
        return number > min && number < max;
    }

    private readonly laConcu = (inputVideos: VideoModel[]) => {
        const videos: VideoModel[] = [];

        let maxLineIndex = 0;

        for (let i = 0; i < inputVideos.length; i++) {
            const video = { ...inputVideos[i] };

            let found = false;

            for (let j = 0; j < videos.length; j++) {
                const prevVideo = videos[j];

                const a = video;
                const b = prevVideo;

                if (this.isBeetween(video.start_in_seconds, prevVideo.start_in_seconds, prevVideo.end_in_seconds)
                 || this.isBeetween(video.end_in_seconds,   prevVideo.start_in_seconds, prevVideo.end_in_seconds)
                 || (video.start_in_seconds < prevVideo.start_in_seconds && video.end_in_seconds > prevVideo.end_in_seconds)) {
                    found = true;

                    if (video.lineIndex <= prevVideo.lineIndex) {
                        video.lineIndex = prevVideo.lineIndex + 1;

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
        // const videos = this.getVideos(now.startOf("day"), now.endOf("day"));

        const videosByDay = this.getVideosByDay(videos);

        // console.log(videosByDay);

        const { start, end } = this.getMinMaxHours(videos);

        const startHour = Math.floor(start / 3600);
        const endHour   = Math.floor(end   / 3600);

        let hourToShow = [...Array((endHour - startHour) + 1).keys()];

        // if (hourToShow.length > 12) {
        //     hourToShow = hourToShow.filter(hour => hour%2 === 0);
        // }

        const vignetteMarginTopBottom = 6;
        const vignetteHeight = 80 + vignetteMarginTopBottom;

        // console.log('render');

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

                    { videosByDay.map((videos, dayOfTheWeek) => {
                        // console.log(videos);
                        const { videos: videosWithLineInfo, maxLineIndex } = this.laConcu(videos);
                        // console.log(videosWithLineInfo);

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
