import { atom } from "recoil";

export const getSettings = atom({
    key: "getSettings",
    default: {
        locale   : "fr-FR",
        timezone : "Europe/Paris",
    },
});
