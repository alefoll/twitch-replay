import React from "react";
import { useTranslation } from "react-i18next";

import { CLIENTID } from "@helpers/api";

import "./style.css";

export const Login = () => {
    const { t } = useTranslation();

    return (
        <div className="login">
            <div className="login--container">
                <div className="login--container__title"><img className="login--container__logo" src="./assets/TwitchGlitchPurple.svg" alt="Twitch"/>{ t("login.title") }</div>

                <button onClick={ getToken }>{ t("login.action") }</button><br/>
            </div>
        </div>
    )
}

const getToken = () => {
    window.location.assign(`https://id.twitch.tv/oauth2/authorize?client_id=${ CLIENTID }&redirect_uri=https://alefoll.github.io/twitch-replay/&response_type=token`);
}
