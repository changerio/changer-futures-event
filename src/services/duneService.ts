import { getDuneCache } from "../cache";
import { logger } from "../utils/logger";
import { DuneExecutionResult, executeQuery, getExecutionResult, getQueryResult } from "../data/dune";
import { ARBITRUM_NETWORK_STR, ZKSYNCERA_NETWORK_STR } from "../config/constants";

const cache = getDuneCache();

const CACHE_KEY = {
    VAULT_APR: "VAULT_APR",
}

const QUERY = {
    // public
    VAULT_APR: 3251465,

    // private
    PRIVATE_TRADER: 3226962, // close trade list
}

let retryCount = 0;
const maxRetryCount = 10;

const DEFAULT_APR = { arbitrum: { cng_apr: 7, usdc_apr: 25 }, zksync: { cng_apr: 7, usdc_apr: 25 }, };

export async function getAPR(network: string) {
    const cacheKey = CACHE_KEY.VAULT_APR;
    if (!(await cache.fileExists(cacheKey))) {
        await setAPR();
    }

    const apr = await cache.get(cacheKey);
    if (network == ARBITRUM_NETWORK_STR) {
        return apr.arbitrum;
    } else if (network == ZKSYNCERA_NETWORK_STR) {
        return apr.zksync;
    }

    return apr;
}

export async function setAPR() {
    const result: DuneExecutionResult = await getQueryResult(QUERY.VAULT_APR);
    if (!result.result || !result.result?.rows) {
        excuteUsdcAPR();
        await cache.set(CACHE_KEY.VAULT_APR, DEFAULT_APR);
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
        const arbi_usdc_apr = rows[0]?.arbi_USDC_APR_7 * 100 ?? DEFAULT_APR.arbitrum.usdc_apr;
        const arbi_cng_apr = rows[0]?.arbi_CNG_APR_7 * 100 ?? DEFAULT_APR.arbitrum.cng_apr;
        const zk_usdc_apr = rows[0]?.zk_USDC_APR_7 * 100 ?? DEFAULT_APR.zksync.usdc_apr;
        const zk_cng_apr = rows[0]?.zk_CNG_APR_7 * 100 ?? DEFAULT_APR.zksync.cng_apr;
        const aprs = {
            arbitrum: { cng_apr: arbi_cng_apr, usdc_apr: arbi_usdc_apr },
            zksync: { cng_apr: zk_cng_apr, usdc_apr: zk_usdc_apr }
        };

        logger.info("[Dune] Set arbi USDC_APR : " + arbi_usdc_apr + " arbi CNG_APR : " + arbi_cng_apr
            + " zk USDC_APR : " + zk_usdc_apr + " zk CNG_APR : " + zk_cng_apr);
        await cache.set(CACHE_KEY.VAULT_APR, aprs);
    } catch (error) {
        logger.error("[Dune] Error in getting execution result:", error);
        getExecutionResultWithDelay(result.execution_id, parseAPR);
        return false;
    }
    return true;
}

export async function excuteUsdcAPR() {
    retryCount = 0;
    const ret = await executeQuery(QUERY.VAULT_APR);

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