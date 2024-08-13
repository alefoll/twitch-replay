import React, { Suspense } from "react";
import { useRecoilValue } from "recoil";

import { format, VideoModel } from "@components/Video";
import { User, UserModel } from "@components/User";

import { getCurrentUserFollowLives, getCurrentUserFollowModel, getUserColor } from "@helpers/user";

import "./style.css";

export const LiveList = () => {
    return (
        <Suspense fallback={<></>}>
            <LiveListContent />
        </Suspense>
    );
}

const LiveListContent = () => {
    const lives = useRecoilValue(getCurrentUserFollowLives);
    const users = useRecoilValue(getCurrentUserFollowModel);

    if (lives.length === 0) {
        return (<></>);
    }

    return (
        <div className="live-list">
            { lives.map((live) => {
                const user = users.find(user => user.id === live.user_id);

                if (!user) {
                    throw new Error(`No user found for id: ${ live.user_id }`);
                }

                return LiveBadge({ live, user });
            }) }
        </div>
    );
}

const LiveBadge = ({
    live,
    user,
}: {
    live: VideoModel,
    user: UserModel
}) => {
    const userColor = useRecoilValue(getUserColor(user.id));

    const style: React.CSSProperties = {
        backgroundColor: userColor.value,
    }

    const className = ["live-list--badge"];

    if (userColor.contrast) {
        className.push("contrast");
    }

    return (
        <a key={ live.id } className={ className.join(" ") } href={ `https://www.twitch.tv/${ user.login }` } target="_blank" style={ style }>
            <User user={ user } />

            <div className="live-list--badge__data">
                <span className="live-list--badge__firstline">
                    { user.display_name }
                    <span className="spacer" />
                    🔴 { format(live.viewer_count!) }
                </span>

                { live.game_name }
            </div>
        </a>
    );
}
