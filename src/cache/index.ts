import Cache from "file-system-cache";

const eventCache = Cache({
    basePath: "./.cache",
    ns: "event"
});

export function getEventCache() {
    return eventCache;
}