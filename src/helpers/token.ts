import { atom, selector } from "recoil";

const TOKENKEY = "twitch-token";

const tokenAtom = atom({
  key: "tokenAtom",
  default: window.localStorage.getItem(TOKENKEY) || "",
});

export const getToken = selector<string>({
    key: "getToken",
    get: ({ get }) => (get(tokenAtom)),
    set: ({ set }, newValue) => {
        if (typeof newValue === "string") {
            window.localStorage.setItem(TOKENKEY, newValue);

            return set(
                tokenAtom,
                newValue,
            )
        } else {
            window.localStorage.removeItem(TOKENKEY);

            return set(
                tokenAtom,
                "",
            )
        }
    }
});
