import { atom, selector } from "recoil";
import { DateTime } from "luxon";

interface Settings {
    locale: string,
    timezone: string,
}

export const SETTINGSKEY = "settings";

const settingsAtom = atom({
    key: "settingsAtom",
    default: window.localStorage.getItem(SETTINGSKEY),
});

export const getSettings = selector<Settings>({
    key: "getSettings",
    get: ({ get }) => {
        const settings = get(settingsAtom);

        if (!settings) {
            return {
                locale   : "",
                timezone : DateTime.local().zoneName,
            }
        }

        return JSON.parse(settings);
    },
    set: ({ set }, newValue) => {
        const value = JSON.stringify(newValue);

        window.localStorage.setItem(SETTINGSKEY, value);

        set(settingsAtom, value);
    }
});
