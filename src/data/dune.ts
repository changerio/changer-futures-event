import axios from "axios";
import { logger } from "../utils/logger";
import config from "../config/default";
import { AxiosResponse } from "axios";

export interface DuneApiResponse {
    execution_id: string;
    state: string;
}
export interface DuneExecutionResult {
    execution_id: string,
    query_id: number,
    state: string, // 'QUERY_STATE_EXECUTING',
    submitted_at: Date,
    execution_started_at: Date,

    expires_at?: Date,
    execution_ended_at?: Date,
    result?: { 'rows': any[], 'metadata': { [key: string]: any } }
}

export async function executeQuery(queryId: number, params: { [key: string]: string } = {}): Promise<DuneApiResponse> {
    const headers = {
        "x-dune-api-key": config.DUNE_API_KEY,
        "Content-Type": "application/json"
    };

    try {
        const response: AxiosResponse<DuneApiResponse> = await axios.post(
            `https://api.dune.com/api/v1/query/${queryId}/execute`,
            { "query_parameters": params },
            { headers }
        );

        const result: DuneApiResponse = response.data;
        return result;
    } catch (error) {
        logger.error("[Dune] Error calling Dune API:", error);
        throw error;
    }
}

export async function getQueryResult(queryId: number, params: { [key: string]: string } = {}): Promise<DuneExecutionResult> {
    const headers = {
        "x-dune-api-key": config.DUNE_API_KEY
    };

    try {
        const response: AxiosResponse<DuneExecutionResult> = await axios.get(
            `https://api.dune.com/api/v1/query/${queryId}/results`,
            { headers }
        );

        const result: DuneExecutionResult = response.data;
        return result;
    } catch (error) {
        logger.error("[Dune] Error calling Dune API:", error);
        throw error;
    }
}

export async function getExecutionResult(executionId: string): Promise<DuneExecutionResult> {
    const headers = {
        "x-dune-api-key": config.DUNE_API_KEY
    };

    try {
        const response: AxiosResponse<DuneExecutionResult> = await axios.get(
            `https://api.dune.com/api/v1/execution/${executionId}/results`,
            { headers }
        );

        const result: DuneExecutionResult = response.data;
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
