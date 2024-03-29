import React from "react";
import { useRecoilValue } from "recoil";

import { VideoModel } from "@components/Video";

import { getCurrentUserFollowLives, getUserColor } from "@helpers/user";

import "./style.css";

export interface UserFollow {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    followed_at: string;
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

export interface UserColor {
    value: string;
    contrast: boolean;
}

export const User = ({
    hide,
    onClick,
    user,
}: {
    hide    ?: boolean,
    onClick ?: (user: UserModel) => void,
    user     : UserModel,
}) => {
    const {
        display_name,
        id,
        login,
        profile_image_url,
    } = user;

    const lives = useRecoilValue(getCurrentUserFollowLives);
    const color = useRecoilValue(getUserColor(user.id));

    const isLive = lives.find((live) => live.user_id === id);

    const style: React.CSSProperties = {
        borderColor: color.value,
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
