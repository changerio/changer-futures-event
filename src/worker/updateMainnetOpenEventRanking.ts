import schedule from "node-schedule";
import { logger } from "../utils/logger";

import { upsertMainnetOpenEvent } from "../services/eventService";

function updateMainnetOpenEventRanking() {
  logger.info(`[UpdateMainnetOpenEventRanking] ${new Date()}`);
  upsertMainnetOpenEvent();
}

export const loadWorker = () => {
  // Called once at startup
  updateMainnetOpenEventRanking();
  // 10s
  // schedule.scheduleJob("*/10 * * * * *", () => {
  // 10m
  schedule.scheduleJob("*/10 * * * *", () => {
    updateMainnetOpenEventRanking();
  });
};
