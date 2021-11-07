import React from "react";
import { useRecoilValue } from "recoil";

import { getCurrentUserFollow } from "@helpers/user";

import "./style.css";

export const NoFollow = () => {
    const users = useRecoilValue(getCurrentUserFollow);

    if (users.length !== 0) {
        return <></>;
    }

    return (
        <div className="no-follow--empty">
            <div className="no-follow--card">
                <div className="no-follow--card__img">
                    <img src="assets/follow.png" alt="" />
                </div>
                <h3>Le calendrier est vide</h3>
                Oh oh, tu ne suis aucune chaîne<br />
                <a href="https://www.twitch.tv/">
                    <button className="no-follow--card__button">
                        <svg width="20px" height="20px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px">
                            <g>
                                <path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829zm.829 10l5.414-5.414A2 2 0 0016 7.343V7a2 2 0 00-2-2h-.343a2 2 0 00-1.414.586L10 7.828 7.757 5.586A2 2 0 006.343 5H6a2 2 0 00-2 2v.343a2 2 0 00.586 1.414L10 14.172z"></path>
                            </g>
                        </svg>
                        Aller suivre des chaînes
                    </button>
                </a>
            </div>
        </div>
    );
}
