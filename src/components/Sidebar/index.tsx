import { User, UserModel, UserProps } from "@components/User";
import React from "react";

import "./style.css";

export interface SidebarProps {
    users?: UserModel[];
    getVideos(user: UserProps, pagination?: string): Promise<void>;
}

export class Sidebar extends React.PureComponent<SidebarProps> {
    render() {
        return (
            <div className="sidebar">
                <img className="sidebar--twitch-logo" src="./assets/TwitchGlitchBlackOps.svg" alt="Twitch"/>

                <div className="sidebar--userlist">
                    { this.props.users?.map(user => <User key={ user.id } { ...user } getVideos={this.props.getVideos} />) }
                </div>
            </div>
        )
    }
}
