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
    startInSeconds: number;
    endInSeconds: number;
    lineIndex:number;
    lineNumber:number;
}

export interface VideoProps extends VideoModel {
    style: React.CSSProperties
}

export class Video extends React.PureComponent<VideoProps> {
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
                <div className="video--thumbnail">
                    <img className="video--thumbnail__image" src={ this.getThumbnail(thumbnail_url) } alt={ title }/>
                    <span className="video--thumbnail__duration">{ duration }</span>
                </div>

                <div className="video--title">{ title }</div>
            </a>
        );
    }
}
