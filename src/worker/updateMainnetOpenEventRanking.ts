import schedule from "node-schedule";
import { logger } from "../utils/logger"

import { setMainnetOpenEvent } from "../services/eventService";

function updateMainnetOpenEventRanking() {
  logger.info(`[UpdateMainnetOpenEventRanking] ${new Date()}`)
  setMainnetOpenEvent();
}

export const loadWorker = () => {
  // 10s
  // schedule.scheduleJob("*/10 * * * * *", () => {
  // 10m
  schedule.scheduleJob("*/10 * * * *", () => {
    updateMainnetOpenEventRanking();
  });
};
