import { atom, selector } from "recoil";
import { DateTime } from "luxon";

import { getSettings } from "@helpers/settings";

const week = atom({
    key: "week",
    default: DateTime.local(),
});

export const getWeek = selector<DateTime>({
    key: "getWeek",
    get: ({ get }) => get(week).setZone(get(getSettings).timezone),
    set: ({ set }, newValue) => set(week, newValue),
});
