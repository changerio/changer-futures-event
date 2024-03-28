import schedule from "node-schedule";
import { logger } from "../utils/logger";

import { setMidnightPairPrice } from "../services/pythService";
import { getWeeklyEventTarget, setWeeklyTradingEvent, upsertTradingEvent } from "../services/eventService";
import { END_TIMESTAMP } from "../data/event";
import { excuteDashboardQuery, executeDashboardTwiceDailyQuery, setAPR } from "../services/duneService";

let retryCount = 0;
const retryMaxCount = 10;

async function retryUpsertTradingEventOnFailure() {
  try {
    logger.info(`[retryUpsertTradingEventOnFailure] ${new Date()}`);
    await upsertTradingEvent([getWeeklyEventTarget(), "MAIN"]);
  } catch (e) {
    retryCount += 1;
    logger.error(`[retryUpsertTradingEventOnFailure] Fail`);
    logger.error(e);
    if (retryCount < retryMaxCount) {
      setTimeout(retryUpsertTradingEventOnFailure, 1000); // 1s
    }
  }
}

async function retrySetWeeklyTradingEventOnFailure() {
  try {
    logger.info(`[retrySetWeeklyTradingEventOnFailure] ${new Date()}`);
    await setWeeklyTradingEvent();
  } catch (e) {
    retryCount += 1;
    logger.error(`[retrySetWeeklyTradingEventOnFailure] Fail`);
    logger.error(e);
    if (retryCount < retryMaxCount) {
      setTimeout(retrySetWeeklyTradingEventOnFailure, 1000); // 1s
    }
  }
}

async function retrySetMidnightPairPriceOnFailure() {
  try {
    logger.info(`[retrySetMidnightPairPriceOnFailure] ${new Date()}`);
    await setMidnightPairPrice();
  } catch (e) {
    retryCount += 1;
    logger.error(`[retrySetMidnightPairPriceOnFailure] Fail`);
    logger.error(e);
    if (retryCount < retryMaxCount) {
      setTimeout(retrySetMidnightPairPriceOnFailure, 10000); // 10s
    }
  }
}

async function retryExcuteDashboardQueryOnFailure() {
  try {
    logger.info(`[retryExcuteDashboardQueryOnFailure] ${new Date()}`);
    await excuteDashboardQuery();
  } catch (e) {
    retryCount += 1;
    logger.error(`[retryExcuteDashboardQueryOnFailure] Fail`);
    logger.error(e);
    if (retryCount < retryMaxCount) {
      // ignore
    }
  }
}

async function retryExcuteDashboardTwiceDailyQueryOnFailure() {
  try {
    logger.info(`[retryExcuteDashboardTwiceDailyQueryOnFailure] ${new Date()}`);
    await executeDashboardTwiceDailyQuery();
  } catch (e) {
    retryCount += 1;
    logger.error(`[retryExcuteDashboardTwiceDailyQueryOnFailure] Fail`);
    logger.error(e);
    if (retryCount < retryMaxCount) {
      // ignore
    }
  }
}
async function retrySetAPROnFailure() {
  try {
    logger.info(`[retrySetAPROnFailure] ${new Date()}`);
    await setAPR();
  } catch (e) {
    retryCount += 1;
    logger.error(`[retrySetAPROnFailure] Fail`);
    logger.error(e);
    if (retryCount < retryMaxCount) {
      // ignore
    }
  }
}

function _currentWithInEndTime(): boolean {
  const currentTime = new Date().getTime();

  for (const key in END_TIMESTAMP) {
      if (currentTime < parseInt(END_TIMESTAMP[key])) {
          return false;
      }
  }
  return true;
}

export const loadWorker = () => {
  // Called once at startup
  // retryUpsertTradingEventOnFailure();
  retrySetMidnightPairPriceOnFailure();
  // setAPR();

  if (_currentWithInEndTime()) {
    retrySetWeeklyTradingEventOnFailure();
  }

  // every 10m
  schedule.scheduleJob("*/10 * * * *", () => {
    retryCount = 0;

    if (_currentWithInEndTime()) {
      retryUpsertTradingEventOnFailure();
    }
  });

  // daily - 00:00:01
  schedule.scheduleJob("1 0 0 * * *", () => {
    retryCount = 0;
    retryExcuteDashboardQueryOnFailure();
    retrySetMidnightPairPriceOnFailure();

    if (_currentWithInEndTime()) {
      retrySetWeeklyTradingEventOnFailure();
    }
  });

  // twice daily - 00:10:01
  schedule.scheduleJob("1 10 0 1-31/2 * *", () => {
    retryCount = 0;
    retryExcuteDashboardTwiceDailyQueryOnFailure();
  });

  // daily - 00:00:30
  schedule.scheduleJob("30 0 0 * * *", () => {
    retrySetAPROnFailure();
  });
};
