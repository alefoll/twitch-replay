import { App } from "@components/App";
import React from "react";

import "./style.css";

export class Login extends React.PureComponent<{}> {
    private readonly getToken = () => {
        window.location.assign(`https://id.twitch.tv/oauth2/authorize?client_id=${ App.clientID }&redirect_uri=https://alefoll.github.io/twitch-replay/&response_type=token`);
    }

    render() {
        return (
            <div className="login">
                <div className="login--container">
                    <div className="login--container__title"><img className="login--container__logo" src="./assets/TwitchGlitchPurple.svg" alt="Twitch"/> Log in to Twitch</div>

                    <button onClick={ this.getToken }>Log In</button><br/>
                </div>
            </div>
        )
    }
}
