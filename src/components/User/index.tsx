import React from "react";
import { VideoModel } from "@components/Video";

import "./style.css";

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

export class User extends React.PureComponent<UserProps> {
    render() {
        const {
            id,
            isLive,
            color,
            display_name,
            login,
            profile_image_url,
        } = this.props;

        const style: React.CSSProperties = {
            borderColor: color
        }

        return (
            <a className="user" href={ `https://www.twitch.tv/${ login }` } target="_blank">
                <img key={ id } style={ style } src={ profile_image_url } alt={ display_name }/>
                { isLive && <span className="user--live" /> }
            </a>
        )
    }
}
