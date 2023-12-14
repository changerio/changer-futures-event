import { getDuneCache } from "../cache";
import { logger } from "../utils/logger";
import { DuneExecutionResult, executeQuery, getExecutionResult, getQueryResult } from "../data/dune";

const QUERY = {
    // public
    ARBITRUM_APR: 3251465,

    // private
    PRIVATE_TRADER: 3226962, // close trade list
}

const cache = getDuneCache();

const CACHE_KEY = {
    ARBITRUM_APR: "ARBITRUM_APR"
}

let retryCount = 0;
const maxRetryCount = 10;

const DEFAULT_APR = { cng_apr: 7, usdc_apr: 25 };

export async function getAPR(network: string) {
    const cacheKey = network == "arbitrum" ? CACHE_KEY.ARBITRUM_APR : CACHE_KEY.ARBITRUM_APR;
    if (!(await cache.fileExists(cacheKey))) {
        await setAPR(network);
    }

    const apr = await cache.get(cacheKey);
    return apr;
}

export async function setAPR(network: string) {
    const result: DuneExecutionResult = await getQueryResult(QUERY.ARBITRUM_APR);
    if (!result.result || !result.result?.rows) {
        excuteUsdcAPR();
        await cache.set(CACHE_KEY.ARBITRUM_APR, DEFAULT_APR);
    }
    await parseAPR(result);
}

async function parseAPR(result: DuneExecutionResult) {
    if (!result || !result.execution_id || result.state == "QUERY_STATE_PENDING" || !result.result || !result.result?.rows) {
        if (!result || !result.execution_id) {
            excuteUsdcAPR();
        } else {
            getExecutionResultWithDelay(result.execution_id, parseAPR);
        }
        return false;
    }

    try {
        const rows = result.result?.rows;
        const usdc_apr = rows[0]?.USDC_APR ?? 10;
        const cng_apr = rows[0]?.CNG_APR ?? 1;
        const aprs = { cng_apr, usdc_apr };

        logger.info("[Dune] Set USDC_APR : " + usdc_apr + " CNG_APR : " + cng_apr);
        await cache.set(CACHE_KEY.ARBITRUM_APR, aprs);
    } catch (error) {
        logger.error("[Dune] Error in getting execution result:", error);
        getExecutionResultWithDelay(result.execution_id, parseAPR);
        return false;
    }
    return true;
}

export async function excuteUsdcAPR() {
    retryCount = 0;
    const ret = await executeQuery(QUERY.ARBITRUM_APR);

    getExecutionResultWithDelay(ret.execution_id, parseAPR);
}

async function getExecutionResultWithDelay(executionId: string, callback: Function) {
    retryCount += 1
    if (retryCount < maxRetryCount) {
        setTimeout(async () => {
            try {
                const result: DuneExecutionResult = await getExecutionResult(executionId);
                callback(result);
            } catch (error) {
                getExecutionResultWithDelay(executionId, callback);
            }
        }, 2000);
    }
}