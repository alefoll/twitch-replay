import React from "react";
import { useRecoilState } from "recoil";

import { Settings } from "@components/Settings";

import { getWeek } from "@helpers/week";

import "./style.css";

export const Header = () => {
    const [week, setWeek] = useRecoilState(getWeek);

    const previousWeek = () => {
        setWeek(
            week.minus({ weeks: 1 })
        );
    }

    const nextWeek = () => {
        setWeek(
            week.plus({ weeks: 1 })
        );
    }

    return (
        <div className="header">
            <h1 className="header--title">Calendrier des VODs</h1>

            <div className="spacer"></div>

            <div className="header--weekpicker">
                <button onClick={ previousWeek }>
                    <svg width="16px" height="16px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M13.5 14.5L9 10l4.5-4.5L12 4l-6 6 6 6 1.5-1.5z"></path></g></svg>
                </button>

                <p>
                    { week.startOf("week").toFormat("dd/MM") } – { week.endOf("week").toFormat("dd/MM") }
                </p>

                <button onClick={ nextWeek }>
                    <svg width="16px" height="16px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M6.5 5.5L11 10l-4.5 4.5L8 16l6-6-6-6-1.5 1.5z"></path></g></svg>
                </button>
            </div>

            {/* <Settings /> */}
        </div>
    );
}
