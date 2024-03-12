import { getPairCache } from "../cache";
import { logger } from "../utils/logger";
// import { PYTH, SUBGRAPHS } from "../config/constants";
import { fetchData } from "../utils/axios";
import { GambitGraphQL } from "../subgraph/gambit";
import config from "../config/default";

const arbitrumGraphQL: GambitGraphQL = new GambitGraphQL(
  config.subgraph.arbitrum
);
const PYTH_API = config.PYTH_API;

const PRICE_CACHE_KEY = "midnight_price";
const cache = getPairCache();

function getUTCMidnightTimestamp(
  year: number,
  month: number,
  date: number
): number {
  const utcTimestamp = Date.UTC(
    year,
    month,
    date,
    0, // Hours
    0, // Minutes
    0, // Seconds
    0 // Milliseconds
  );

  return utcTimestamp / 1000;
}

function getTodayMidnightTimestamp(): number {
  const currentDate = new Date();
  return getUTCMidnightTimestamp(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate()
  );
}

export async function setMidnightPairPrice() {
  const midnightTime = getTodayMidnightTimestamp();

  const { pairs } = await arbitrumGraphQL.getPairs();
  if (!pairs) {
    logger.error("[ERROR][setMidnightPairPrice] Invalid pairs");
    return;
  }

  let priceMap = (await cache.get(PRICE_CACHE_KEY)) ?? {};
  for (const pair of pairs) {
    const pairId = pair.id;
    const priceFeedId = pair.feed.priceId1;
    const priceUrl = `${PYTH_API}/get_price_feed?id=${priceFeedId}&publish_time=${midnightTime}`;
    const data = await fetchData(priceUrl)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error(priceUrl);
        console.error(
          "[ERROR][setMidnightPairPrice] GET Request Error:",
          error.message
        );
      });

    if (!data) {
      logger.error(
        `[ERROR][setMidnightPairPrice] Invalid pair price (${pairId}, ${priceFeedId})`
      );
      continue;
    }
    data["name"] = pair.name;

    priceMap[pairId] = data;
  }

  await cache.set(PRICE_CACHE_KEY, priceMap);
  return priceMap;
}

export async function getMidnightPairPrice() {
  if (!PRICE_CACHE_KEY || !(await cache.fileExists(PRICE_CACHE_KEY))) {
    await setMidnightPairPrice();
  }

  return await cache.get(PRICE_CACHE_KEY);
}
