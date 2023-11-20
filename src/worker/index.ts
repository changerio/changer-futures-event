import schedule from "node-schedule";
import { logger } from "../utils/logger";

import { setMidnightPairPrice } from "../services/pythService";
import { upsertMainnetOpenEvent } from "../services/eventService";

function updateMainnetOpenEventRanking() {
  logger.info(`[UpdateMainnetOpenEventRanking] ${new Date()}`);
  upsertMainnetOpenEvent();
}

function updateMidnightPairPrice() {
  logger.info(`[UpdateMidnightPairPrice] ${new Date()}`);
  setMidnightPairPrice();
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

