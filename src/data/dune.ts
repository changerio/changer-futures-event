import { promises } from "dns";
import { logger } from "../utils/logger";
import { getDuneCache } from "../cache";
import config from "../config/default";

interface DuneApiResponse {
    execution_id: string;
    state: string;
}
interface DuneExecutionResult {
    execution_id: string,
    query_id: number,
    state: string, // 'QUERY_STATE_EXECUTING',
    submitted_at: Date,
    execution_started_at: Date,

    expires_at?: Date,
    execution_ended_at?: Date,
    result?: { 'rows': any[], 'metadata': { [key: string]: any } }
}

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

const DEFAULT_APR = { cng_apr: 1, usdc_apr: 10 };

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

async function executeQuery(queryId: number, params: { [key: string]: string } = {}): Promise<DuneApiResponse> {
    const headers = {
        "x-dune-api-key": config.DUNE_API_KEY
    };
    // const header = new Headers(meta);

    try {
        const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/execute`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ "query_parameters": params })
        });
        if (!response.ok) {
            throw new Error(`[Dune] Dune API request failed with status: ${response.status}`);
        }
        const body: DuneApiResponse = await response.json();
        return body;
    } catch (error) {
        logger.error("[Dune] Error calling Dune API:", error);
        throw error;
    }
}

async function getQueryResult(queryId: number, params: { [key: string]: string } = {}): Promise<DuneExecutionResult> {
    const headers = {
        "x-dune-api-key": config.DUNE_API_KEY
    };
    // const header = new Headers(meta);

    try {
        const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`[Dune] Dune API request failed with status: ${response.status}`);
        }
        const body: DuneExecutionResult = await response.json();
        return body;
    } catch (error) {
        logger.error("[Dune] Error calling Dune API:", error);
        throw error;
    }
}

async function getExecutionResult(executionId: string): Promise<DuneExecutionResult> {
    const headers = {
        "x-dune-api-key": config.DUNE_API_KEY
    };

    try {
        const response = await fetch(`https://api.dune.com/api/v1/execution/${executionId}/results`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`[Dune] Dune API request failed with status: ${response.status}`);
        }

        const result: DuneExecutionResult = await response.json();
        return result;
    } catch (error) {
        logger.error("[Dune] Error fetching execution result from Dune API:", error);
        throw error;
    }
}

// async function paramSample(address) {
//     const param = { "trader": "0xc15e011b8e117fba8cc241c70950fc79f515ab3e" };
//     const ret = await executeQuery(QUERY.PRIVATE_TRADER, param);
//     console.log(await getExecutionResult(ret.execution_id));
// }
