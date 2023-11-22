import schedule from "node-schedule";
import { logger } from "../utils/logger";

import { setMidnightPairPrice } from "../services/pythService";
import { upsertMainnetOpenEvent } from "../services/eventService";

async function updateMainnetOpenEventRanking() {
  try {
    logger.info(`[UpdateMainnetOpenEventRanking] ${new Date()}`);
    await upsertMainnetOpenEvent();
  } catch (e) {
    logger.error(`[UpdateMainnetOpenEventRanking] Fail`);
    logger.error(e);
    setTimeout(updateMainnetOpenEventRanking, 1000); // 1s
  }
}

async function updateMidnightPairPrice() {
  try {
    logger.info(`[UpdateMidnightPairPrice] ${new Date()}`);
    await setMidnightPairPrice();
  } catch (e) {
    logger.error(`[UpdateMidnightPairPrice] Fail`);
    logger.error(e);
    setTimeout(updateMidnightPairPrice, 1000); // 1s
  }
}

export const loadWorker = () => {
  // Called once at startup
  updateMainnetOpenEventRanking();
  updateMidnightPairPrice();

  // every 10m
  schedule.scheduleJob("*/10 * * * *", () => {
    updateMainnetOpenEventRanking();
  });

  // 00:00:01
  schedule.scheduleJob("1 0 0 * * *", () => {
    updateMidnightPairPrice();
  });
};

