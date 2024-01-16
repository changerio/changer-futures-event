import schedule from "node-schedule";
import { logger } from "../utils/logger";

import { setMidnightPairPrice } from "../services/pythService";
import { setWeeklyTradingEvent, upsertTradingEvent } from "../services/eventService";
import { excuteDashboardQuery, setAPR } from "../services/duneService";

let retryCount = 0;
const retryMaxCount = 10;

async function retryUpsertTradingEventOnFailure() {
    try {
        logger.info(`[retryUpsertTradingEventOnFailure] ${new Date()}`);
        await upsertTradingEvent();
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


const EVENT_END_TIME = 1707264010000; // 2024년 2월 7일 0시 0분 0초 (GMT) + 10s

export const loadWorker = () => {
    // Called once at startup
    // retryUpsertTradingEventOnFailure();
    // retrySetMidnightPairPriceOnFailure();
    // setAPR();
    const currentTime = (new Date()).getTime();
    if (currentTime < EVENT_END_TIME) {
        retrySetWeeklyTradingEventOnFailure();
    }

    // every 10m
    schedule.scheduleJob("*/10 * * * *", () => {
        retryCount = 0;
        const currentTimestamp = (new Date()).getTime();
        if (currentTimestamp < EVENT_END_TIME) {
            retryUpsertTradingEventOnFailure();
        }
    });

    // daily - 00:00:01
    schedule.scheduleJob("1 0 0 * * *", () => {
        retryCount = 0;
        retryExcuteDashboardQueryOnFailure();
        retrySetMidnightPairPriceOnFailure();
        const currentTime = (new Date()).getTime();
        if (currentTime < EVENT_END_TIME) {
            retrySetWeeklyTradingEventOnFailure();
        }
    });

    // daily - 00:00:30
    schedule.scheduleJob("30 0 0 * * *", () => {
        retrySetAPROnFailure();
    });
};

