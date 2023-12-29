import schedule from "node-schedule";
import { logger } from "../utils/logger";

import { setMidnightPairPrice } from "../services/pythService";
import { setMainnetOpenEvent, upsertMainnetOpenEvent } from "../services/eventService";
import { excuteDashboardQuery, setAPR } from "../services/duneService";

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

async function excuteDuneDashboardQuery() {
    try {
        logger.info(`[ExcuteDuneDashboardQuery] ${new Date()}`);
        await excuteDashboardQuery();
    } catch (e) {
        logger.error(`[ExcuteDuneDashboardQuery] Fail`);
        logger.error(e);
    }
}

const EVENT_END_TIME = 1704499210000; // 2024년 1월 6일 0시 0분 0초 (GMT) + 10s

export const loadWorker = () => {
    // Called once at startup
    updateMainnetOpenEventRanking();
    updateMidnightPairPrice();
    setAPR();

    // every 10m
    schedule.scheduleJob("*/10 * * * *", () => {
        const currentTimestamp = (new Date()).getTime();
        if (currentTimestamp < EVENT_END_TIME) {
            updateMainnetOpenEventRanking();
        }
    });

    // daily - 00:00:01
    schedule.scheduleJob("1 0 0 * * *", () => {
        excuteDuneDashboardQuery();
        updateMidnightPairPrice();
        const currentTime = (new Date()).getTime();
        if (currentTime < EVENT_END_TIME) {
            setMainnetOpenEvent();
        }
    });

    // daily - 00:00:30
    schedule.scheduleJob("30 0 0 * * *", () => {
        setAPR();
    });
};

