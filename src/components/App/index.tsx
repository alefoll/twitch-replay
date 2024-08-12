import React from "react";
import { useRecoilState } from "recoil";

import "@i18n/config";

import { Calendar } from "@components/Calendar";
import { Header } from "@components/Header";
import { LiveList } from "@components/LiveList";
import { Login } from "@components/Login";
import { Sidebar } from "@components/Sidebar";

import { getToken } from "@helpers/token";

import "./style.css";

export const App = () => {
    const [token, setToken] = useRecoilState(getToken);

    if (window.location.hash.length) {
        const hash = window.location.hash.slice(1);

        const hashParsed = hash.split("&").reduce((previous: any, current) => {
            const key = current.split("=")[0];
            const value = current.split("=")[1];

            previous[key] = value;

            return previous;
        }, {});

        if (hashParsed.access_token != null) {
            setToken(hashParsed.access_token);
        }

        window.location.hash = "";
    }

    if (token === "") {
        return <Login />;
    }

    return (
        <>
            <Sidebar />

            <main className="app">
                <Header />

                <LiveList />

                <Calendar />
            </main>
        </>
    );
}
