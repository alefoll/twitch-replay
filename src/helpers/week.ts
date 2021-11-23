import { atom, selector } from "recoil";
import { DateTime } from "luxon";

const week = atom({
    key: "week",
    default: DateTime.local(),
});

export const getWeek = selector<DateTime>({
    key: "getWeek",
    get: ({ get }) => get(week).setZone("utc"),
    set: ({ set }, newValue) => set(week, newValue),
});
