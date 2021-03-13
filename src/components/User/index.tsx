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

export class User extends React.PureComponent<UserModel> {
    render() {
        const {
            id,
            display_name,
            profile_image_url,
        } = this.props;

        const loaded = this.props.videos;

        return (
            <div className="user">
                <img className={ loaded ? "loaded" : "" } key={ id } src={ profile_image_url } alt={ display_name }/>
            </div>
        )
    }
}
