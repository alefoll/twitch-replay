import { atom, selector } from "recoil";
import { DateTime } from "luxon";

interface Settings {
    is24Hour: boolean,
    locale: string,
    timezone: string,
}

export const SETTINGSKEY = "settings";

const settingsAtom = atom({
    key: "settingsAtom",
    default: {
        is24Hour : true,
        locale   : "",
        timezone : DateTime.local().zoneName,
    },
});

export const getSettings = selector<Settings>({
    key: "getSettings",
    get: ({ get }) => {
        const defaultSettings = get(settingsAtom);
        const settings = window.localStorage.getItem(SETTINGSKEY);

        if (!settings) {
            return defaultSettings;
        }

        return {
            ...defaultSettings,
            ...JSON.parse(settings),
        }
    },
    set: ({ set }, newValue) => {
        window.localStorage.setItem(SETTINGSKEY, JSON.stringify(newValue));

        set(settingsAtom, newValue);
    }
});
