import React from "react";

import { VideoModel } from "@components/Video";

import "./style.css";

export interface UserFollow {
    followed_at: string;
    from_id: string;
    from_name: string;
    to_id: string;
    to_name: string;
}

export interface UserModel {
    broadcaster_type: "partner" | "affiliate" | "";
    description: string;
    display_name: string;
    email?: string;
    id: string;
    login: string;
    offline_image_url: string;
    profile_image_url: string;
    type: "staff" | "admin" | "global_mod" | "";
    view_count: number;
    created_at: string;
    videos?: VideoModel[];
    video_pagination?: string;
}

export interface UserProps extends UserModel {
    color: string;
    isLive?: boolean;
}

export const User = ({
    hide,
    onClick,
    user,
}: {
    hide    ?: boolean,
    onClick ?: (user: UserProps) => void,
    user     : UserProps,
}) => {
    const {
        color,
        display_name,
        id,
        isLive,
        login,
        profile_image_url,
    } = user;

    const style: React.CSSProperties = {
        borderColor: color,
    }

    if (onClick) {
        const className = ["user"];

        if (hide) {
            className.push("user__hide");
        }

        return (
            <div className={ className.join(" ") } onClick={ () => onClick(user) }>
                <img key={ id } style={ style } src={ profile_image_url } alt={ display_name }/>
                { isLive && <span className="user--live" /> }
            </div>
        )
    } else {
        return (
            <a className="user" href={ `https://www.twitch.tv/${ login }` } target="_blank">
                <img key={ id } style={ style } src={ profile_image_url } alt={ display_name }/>
                { isLive && <span className="user--live" /> }
            </a>
        )
    }
}
