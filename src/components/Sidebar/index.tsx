import React, { Suspense } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import { User, UserProps } from "@components/User";

import { getCurrentUserFollow, getFilteredUsers } from "@helpers/user";

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

    const [filteredUsers, setFilteredUsers] = useRecoilState(getFilteredUsers);

    const filterUser = (user: UserProps) => {
        if (filteredUsers.includes(user)) {
            return setFilteredUsers(filteredUsers.filter((filteredUser) => filteredUser.id !== user.id));
        }

        setFilteredUsers([ ...filteredUsers, user ]);
    }

    return (
        <div className="sidebar--userlist">
            <div className="sidebar--unfilter" onClick={ () => setFilteredUsers([]) } style={{ opacity: filteredUsers.length > 0 ? 1 : 0 }}>
                <svg version="1.1" viewBox="0 0 100 100" x="0px" y="0px"><rect x="20" y="48" width="60" height="4" rx="2" /></svg>
            </div>

            { users.map(user => <User key={ user.id } user={ user } onClick={ filterUser } hide={ filteredUsers.length > 0 && !filteredUsers.includes(user) } />) }
        </div>
    )
}
