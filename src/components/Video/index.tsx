import { Calendar } from "@components/Calendar";
import { User, UserProps } from "@components/User";
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
    duration_in_seconds: number;
    end_in_seconds: number;
    lineIndex: number;
    copy: boolean;
}

export interface VideoProps extends VideoModel {
    style: React.CSSProperties,
    user?: UserProps
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
        const {
            copy,
            duration,
            lineIndex,
            style,
            title,
            thumbnail_url,
            user,
            url
        } = this.props;

        const className = ["video"];

        if (lineIndex === 0) {
            className.push("video--first");
        }

        if (copy) {
            className.push("video--copy");
        }

        if (user?.color) {
            style.backgroundColor = user.color;
        }

        return (
            <a className={ className.join(" ") } style={ style } href={ url } target="_blank">
                <div className="video--thumbnail">
                    <img className="video--thumbnail__image" src={ this.getThumbnail(thumbnail_url) } alt={ title }/>
                    { user && <div className="video--thumbnail__user">
                        <User { ...user } />
                    </div> }
                    <span className="video--thumbnail__duration">{ duration }</span>
                </div>

                <div className="video--title">{ title }</div>
            </a>
        );
    }
}
