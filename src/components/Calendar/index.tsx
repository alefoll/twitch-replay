import React from "react";
import { UserModel } from "@components/User";
import { Video, VideoModel } from "@components/Video";

import "./style.css";
import { DateTime, Info } from "luxon";

export interface CalendarProps {
    users?: UserModel[];
}

export class Calendar extends React.PureComponent<CalendarProps> {
    getVideos = (from: DateTime, to: DateTime) => {
        const users = this.props.users?.filter(user => user.videos?.length);

        const videos = users?.reduce((previous, user) => {
            const filtered = user.videos?.filter((video) => {
                const videoDate = DateTime.fromISO(video.created_at).setZone("Europe/Paris");

                return videoDate > from && videoDate < to;
            });

            if (filtered) {
                previous.push(...filtered);
            }

            return previous;
        }, [] as VideoModel[]);

        return videos || [];
    }

    getMinMaxHours = (videos: VideoModel[]): { start: number, end: number } => {
        if (videos.length) {
            return {
                start: Math.min(Video.SECONDS_IN_DAY, ...videos.map(_ => _.startInSeconds)),
                end: Math.max(0, ...videos.map(_ => _.endInSeconds))
            }
        }

        return {
            start: 0,
            end: Video.SECONDS_IN_DAY
        }
    }

    getVideosforDay = (day: any) => {
        const lastWeek = new Date();

        lastWeek.setDate(lastWeek.getDate() - 7);

        const users = this.props.users?.filter(user => user.videos?.length);

        const videos = users?.map(user => {
            return user.videos?.filter(video => {
                if (video.thumbnail_url !== "") {
                    const created = new Date(video.created_at);

                    return created.getDay() === day && created > lastWeek;
                }
            }) || [];
        }) || [];

        return videos.flat();
    }

    render() {
        const now = DateTime.local();

        const startOfWeek = now.startOf("week");
        const endOfWeek = now.endOf("week");

        const videos = this.getVideos(startOfWeek, endOfWeek);

        const { start, end } = this.getMinMaxHours(videos);

        const startHour = Math.floor(start / 3600);
        const endHour = Math.floor(end / 3600);

        const calendar = {
            calendar: {
                startSeconds: start,
                endSeconds: end
            }
        }

        // console.log(startHour, endHour);

        return (
            <div className="calendar">
                <div>{ startOfWeek.toLocaleString() } – { endOfWeek.toLocaleString() }</div>


                <div className="calendar--week">
                    <div className="calendar--day">
                        { [...Array(7).keys()].map((day) => {
                            return (
                                <div key={ day } className="calendar--day__element">{ Info.weekdays("long",  { locale: "fr-FR" })[day] }<br/>{ startOfWeek.plus({ day }).toLocaleString() }</div>
                            );
                        }) }
                    </div>


                    <div className="calendar--content">
                        <div className="calendar--time">
                            { [...Array((endHour - startHour) + 1).keys()].map(hour => <div key={ hour }>{ (startHour + hour)%24 + ":00" }</div>) }
                        </div>

                        { [...Array(7).keys()].map((date) => {
                            return (
                                <div key={ date } className="calendar--content__line">
                                    { this.getVideosforDay(date).map(video => <Video key={ video.id } { ...video } { ...calendar } />) }
                                </div>
                            );
                        }) }
                    </div>
                </div>
            </div>
        );
    }
}
