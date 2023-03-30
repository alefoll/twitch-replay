import React, { useState } from "react";
import { useRecoilState } from "recoil";
import { useTranslation } from "react-i18next";
import { getTimeZones, RawTimeZone } from "@vvo/tzdb";

import { getSettings } from "@helpers/settings";

import "./style.css";

export const Settings = () => {
    const [open, setOpen] = useState(false);

    if (open) {
        document.body.classList.add("modal--open");
    } else {
        document.body.classList.remove("modal--open");
    }

    return (
        <>
            <div className="settings" onClick={ () => setOpen(true) }>
                <button className="settings--button">
                    <svg width="24px" height="24px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px">
                        <g>
                            <path d="M10 8a2 2 0 100 4 2 2 0 000-4z"></path>
                            <path d="M9 2h2a2.01 2.01 0 001.235 1.855l.53.22a2.01 2.01 0 002.185-.439l1.414 1.414a2.01 2.01 0 00-.439 2.185l.22.53A2.01 2.01 0 0018 9v2a2.01 2.01 0 00-1.855 1.235l-.22.53a2.01 2.01 0 00.44 2.185l-1.415 1.414a2.01 2.01 0 00-2.184-.439l-.531.22A2.01 2.01 0 0011 18H9a2.01 2.01 0 00-1.235-1.854l-.53-.22a2.009 2.009 0 00-2.185.438L3.636 14.95a2.009 2.009 0 00.438-2.184l-.22-.531A2.01 2.01 0 002 11V9c.809 0 1.545-.487 1.854-1.235l.22-.53a2.009 2.009 0 00-.438-2.185L5.05 3.636a2.01 2.01 0 002.185.438l.53-.22A2.01 2.01 0 009 2zm-4 8l1.464 3.536L10 15l3.535-1.464L15 10l-1.465-3.536L10 5 6.464 6.464 5 10z"></path>
                        </g>
                    </svg>
                </button>
            </div>

            { open && <>
                <div className="settings--backdrop"></div>
                <SettingsModal close={ () => setOpen(false) } />
            </> }
        </>
    )
}

const SettingsModal = ({
    close,
}: {
    close: () => void,
}) => {
    const [settings, setSettings] = useRecoilState(getSettings);

    const { t, i18n } = useTranslation();

    const locales = [{
        name: "English",
        value: "en",
    }, {
        name: "Français",
        value: "fr",
    }];

    const timezones = getTimeZones();

    const updateClock = (is24Hour: boolean) => {
        setSettings({
            ...settings,
            is24Hour,
        });
    }

    const updateLocale = (locale: string) => {
        i18n.changeLanguage(locale);

        setSettings({
            ...settings,
            locale,
        });
    }

    const updateTimezone = (timezone: string) => {
        setSettings({
            ...settings,
            timezone,
        });
    }

    return (
        <div className="settings--modal">
            <div className="settings--modal__content">
                <h3 className="settings--modal__title">{ t("settings.title") }</h3>

                <form>
                    { t("settings.language") }<br />
                    <select name="language" onChange={ e => updateLocale(e.target.value) } defaultValue={ settings.locale }>
                        { locales.map((locale) => {
                            return (
                                <option key={ locale.value } value={ locale.value }>{ locale.name }</option>
                            )
                        }) }
                    </select>

                    <br />
                    <br />

                    { t("settings.timeformat") }<br />
                    <select name="timeformat" onChange={ e => updateClock(e.target.value === "13") } defaultValue={ settings.is24Hour ? "13" : "1pm" }>
                        <option value={ "13" }>13:00</option>
                        <option value={ "1pm" }>1:00pm</option>
                    </select>

                    <br />
                    <br />

                    { t("settings.timezone") }<br />
                    <select name="timezone" onChange={ e => updateTimezone(e.target.value) } defaultValue={ settings.timezone }>
                        { timezones.map((timezone) => {
                            return (
                                <option key={ timezone.name } value={ timezone.name }>({ timezone.rawFormat.split(" ")[0] }) { timezone.mainCities[0] ?? timezone.name }</option>
                            )
                        }) }
                    </select>
                </form>

                <button className="settings--modal__close" onClick={ close }>{ t("settings.close") }</button>
            </div>
        </div>
    );
}
