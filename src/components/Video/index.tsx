import React from "react";
import { DateTime, Duration } from "luxon";

import "./style.css";

export interface VideoApiModel {
    created_at: string;
    description: string;
    duration: string;
    id: string;
    language: string;
    published_at: string;
    thumbnail_url: string;
    title: string;
    type: "upload" | "archive" | "highlight";
    url: string;
    user_id: string;
    user_name: string;
    view_count: number;
    viewable: "public" | "private";
}

export interface VideoModel extends VideoApiModel {
    startInSeconds: number;
    endInSeconds: number;
}

export interface VideoProps extends VideoModel {
    calendar: {
        startSeconds: number;
        endSeconds: number;
    }
}

export class Video extends React.PureComponent<VideoProps> {
    static readonly SECONDS_IN_DAY = 86400;

    private readonly getThumbnail = (url: string): string => {
        return url.replace("%{width}x%{height}", "320x180");
    }

    static readonly durationToPercent = (duration: string): number => {
        const seconds = Video.durationToSeconds(duration);

        if (seconds) {
            return (seconds / Video.SECONDS_IN_DAY) * 100;
        } else {
            throw new Error(`durationToPercent error : ${ duration }`);
        }
    }

    private readonly durationToPercentRelative = (duration: string, prout: number) => {
        const seconds = Video.durationToSeconds(duration);

        if (seconds) {
            return (seconds / prout ) * 100;
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
        const seconds = Video.dateToSeconds(created);

        if (seconds) {
            return (seconds / Video.SECONDS_IN_DAY) * 100;
        } else {
            throw new Error(`dateToPercent error : ${ created }`);
        }
    }

    private readonly dateToPercentRelative = (created: string, begin: number) => {
        const seconds = Video.dateToSeconds(created);

        if (seconds) {
            return ((seconds - begin) / Video.SECONDS_IN_DAY) * 100;
        } else {
            throw new Error(`dateToPercentRelative error : ${ created }`);
        }
    }

    static readonly dateToSeconds = (created: string) => {
        const date = DateTime.fromISO(created).setZone("Europe/Paris");

        const duration = Duration.fromObject({
            hours: date.hour,
            minutes: date.minute,
            seconds: date.second
        });

        const { seconds } = duration.shiftTo("seconds").toObject();

        if (seconds) {
            return seconds;
        } else {
            throw new Error(`dateToSeconds error : ${ created }`);
        }
    }

    render() {
        // console.log(this.props);

        const {
            created_at,
            duration,
            title,
            thumbnail_url,
            url
        } = this.props;

        const { startSeconds, endSeconds } = this.props.calendar;

        const style = {
            left: this.dateToPercentRelative(created_at, startSeconds) + "%",
            width: this.durationToPercentRelative(duration, endSeconds - startSeconds) + "%"
        }

        return (
            <a className="video" style={ style } href={ url } target="_blank">
                <div className="video--thumbnail">
                    <img className="video--thumbnail__image" src={ this.getThumbnail(thumbnail_url) } alt={ title }/>
                    <span className="video--thumbnail__duration">{ duration }</span>
                </div>

                <div className="video--title">{ title }</div>
            </a>
        );
    }
}
