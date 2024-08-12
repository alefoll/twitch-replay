import "./index.html";
import "./style.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { RecoilRoot } from "recoil";

import { App } from "@components/App";
import { ErrorBoundary } from "@components/ErrorBoundary";

import "../assets/favicon.png";
import "../assets/follow.png";
import "../assets/TwitchExtrudedWordmarkPurple.svg";
import "../assets/TwitchGlitchBlackOps.svg";
import "../assets/TwitchGlitchPurple.svg";

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
