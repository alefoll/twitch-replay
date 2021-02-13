import { Calendar } from "@components/Calendar";
import { DateTime, Duration } from "luxon";
import React from "react";

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
    start_in_seconds: number;
    end_in_seconds: number;
    lineIndex:number;
    overlap:number;
}

export interface VideoMetadata {
    overlap: {
        start: VideoModel[],
        end: VideoModel[],
        inner: VideoModel[],
        outer: VideoModel[]
    }
}

export interface VideoProps extends VideoModel {
    style: React.CSSProperties
}

export class Video extends React.PureComponent<VideoProps> {
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

    private readonly getThumbnail = (url: string): string => {
        return url.replace("%{width}x%{height}", "320x180");
    }

    render() {
        // console.log(this.props);

        const {
            duration,
            lineIndex,
            style,
            title,
            thumbnail_url,
            url
        } = this.props;

        return (
            <a className={ "video" + ((lineIndex === 0) ? " video--first" : "") } style={ style } href={ url } target="_blank">
                <img className="video--thumbnail__image" src={ this.getThumbnail(thumbnail_url) } alt={ title }/>
                <span className="video--thumbnail__duration">{ duration }</span>

                <div className="video--title">{ title }</div>
            </a>
        );
    }
}
