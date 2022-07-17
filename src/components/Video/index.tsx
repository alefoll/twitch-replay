import React from "react";

import { User, UserProps } from "@components/User";

import "./style.css";

export interface VideoApiModel {
    created_at: string;
    description?: string;
    duration?: string;
    game_id?: string;
    game_name?: string;
    id: string;
    language: string;
    published_at?: string;
    started_at?: string;
    tag_ids?: string[];
    thumbnail_url: string;
    title?: string;
    type: "upload" | "archive" | "highlight" | "live";
    url?: string;
    user_id: string;
    user_login?: string;
    user_name: string;
    view_count?: number;
    viewer_count?: number;
    viewable?: "public" | "private";
}

export interface VideoModel extends VideoApiModel {
    start_in_seconds: number;
    duration_in_seconds: number;
    end_in_seconds: number;
    lineIndex?: number;
}

export const Video = ({
    style,
    user,
    video,
}: {
    style: React.CSSProperties,
    user?: UserProps,
    video: VideoModel,
}) => {
    const {
        duration,
        lineIndex,
        start_in_seconds,
        title,
        thumbnail_url,
        type,
        url,
        viewer_count
    } = video;

    const className = ["video"];
    const isLive    = (type === "live");

    if (lineIndex === 0) {
        className.push("video--first");
    }

    if (start_in_seconds < 0) {
        className.push("video--before");
    }

    if (isLive) {
        className.push("video--stream");
    }

    if (user?.color) {
        if (isLive) {
            style.background = `linear-gradient(to right, ${ user.color } calc(100% - 42px), transparent)`;
        } else {
            style.backgroundColor = user.color;
        }
    }

    if (user?.contrast) {
        className.push("contrast");
    }

    return (
        <a className={ className.join(" ") } style={ style } href={ url } target="_blank">
            <div className="video--thumbnail">
                <img className="video--thumbnail__image" src={ getThumbnail(thumbnail_url) } alt={ title }/>
                { user && <div className="video--thumbnail__user">
                    <User user={ user } />
                </div> }
                { duration && <span className="video--thumbnail__duration">{ duration }</span> }
                { isLive && <span className="video--live">LIVE - { format(viewer_count!) }</span> }
            </div>

            <div className="video--title">{ title }</div>
        </a>
    );
}

const getThumbnail = (url: string) => {
    return url.replace(/%?{width}x%?{height}/, "320x180");
}

const format = (number: number) => {
    return new Intl.NumberFormat("en", {
        notation: "compact",
    }).format(number);
}
