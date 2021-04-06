import { User, UserProps } from "@components/User";
import React from "react";

import "./style.css";

export interface SidebarProps {
    users?: UserProps[];
}

export class Sidebar extends React.PureComponent<SidebarProps> {
    render() {
        return (
            <div className="sidebar">
                <a className="sidebar--twitch-logo" href="https://www.twitch.tv/">
                    <img src="./assets/TwitchGlitchBlackOps.svg" alt="Twitch"/>
                </a>

                <div className="sidebar--userlist">
                    { this.props.users?.map(user => <User key={ user.id } { ...user } />) }
                </div>
            </div>
        )
    }
}
