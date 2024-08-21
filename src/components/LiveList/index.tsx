import React, { Suspense } from "react";
import { useRecoilValue } from "recoil";

import { format, VideoModel } from "@components/Video";
import { User, UserModel } from "@components/User";

import { getCurrentUserFollowLives, getUser, getUserColor } from "@helpers/user";

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

    if (lives.length === 0) {
        return (<></>);
    }

    return (
        <div className="live-list">
            { lives.map((live) => LiveBadge({ live })) }
        </div>
    );
}

const LiveBadge = ({
    live,
}: {
    live: VideoModel,
}) => {
    const user = useRecoilValue(getUser(live.user_id));
    const userColor = useRecoilValue(getUserColor(live.user_id));

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
                <div className="live-list--badge__streamer">
                    { user.display_name }
                    <span className="spacer" />
                    🔴 { format(live.viewer_count!) }
                </div>

                <div className="live-list--badge__game">{ live.game_name }</div>
            </div>
        </a>
    );
}
