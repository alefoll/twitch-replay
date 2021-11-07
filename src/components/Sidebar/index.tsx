import React, { Suspense } from "react";
import { useRecoilValue } from "recoil";

import { User } from "@components/User";

import { getCurrentUserFollow } from "@helpers/user";

import "./style.css";

export const Sidebar = () => {
    return (
        <div className="sidebar">
            <a className="sidebar--twitch-logo" href="https://www.twitch.tv/">
                <img src="./assets/TwitchGlitchBlackOps.svg" alt="Twitch"/>
            </a>

            <Suspense fallback={<></>}>
                <SidebarContent />
            </Suspense>
        </div>
    )
}

const SidebarContent = () => {
    const users = useRecoilValue(getCurrentUserFollow);

    return (
        <div className="sidebar--userlist">
            { users.map(user => <User key={ user.id } user={ user } />) }
        </div>
    )
}
