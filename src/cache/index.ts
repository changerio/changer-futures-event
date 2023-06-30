import Cache from "file-system-cache";

const monkeyCache = Cache({
    basePath: "./.cache",
    ns: "monkey"
});

const eventCache = Cache({
    basePath: "./.cache",
    ns: "event"
});

export function getMonkeyCache() {
    return monkeyCache;
}
export function getEventCache() {
    return eventCache;
}