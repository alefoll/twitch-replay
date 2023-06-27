import "./index.html";
import "./style.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { RecoilRoot } from "recoil";
import Smartlook from "smartlook-client";

import { App } from "@components/App";
import { ErrorBoundary } from "@components/ErrorBoundary";

import "../assets/favicon.png";
import "../assets/follow.png";
import "../assets/TwitchExtrudedWordmarkPurple.svg";
import "../assets/TwitchGlitchBlackOps.svg";
import "../assets/TwitchGlitchPurple.svg";

Smartlook.init("6b0871215495a4d6be7f030e5a5fea92cdabbf88", { region: "eu" });

const container = document.querySelector("#app");

if (container) {
    createRoot(container).render(
        <RecoilRoot>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </RecoilRoot>
    );
}
