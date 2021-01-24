import "./index.html";
import "./style.css";

import React from "react";
import ReactDOM from "react-dom";

import { App } from "@components/App";

import "../assets/TwitchGlitchPurple.svg";
import "../assets/TwitchGlitchBlackOps.svg";

ReactDOM.render((
    <App />
), document.querySelector("#app"));
