import Cache from "file-system-cache";

const eventCache = Cache({
  basePath: "./.cache/event",
  ns: "event",
});

const pairCache = Cache({
  basePath: "./.cache/pair",
  ns: "pair",
});

const duneCache = Cache({
  basePath: "./.cache/dune",
  ns: "dune",
});

export function getEventCache() {
  return eventCache;
}

export function getPairCache() {
  return pairCache;
}

export function getDuneCache() {
  return duneCache;
}
