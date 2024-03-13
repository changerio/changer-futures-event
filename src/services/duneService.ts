import { getDuneCache } from "../cache";
import { logger } from "../utils/logger";
import { DuneExecutionResult, executeQuery, getExecutionResult, getQueryResult } from "../data/dune";
import { ARBITRUM_NETWORK_STR, ZKSYNCERA_NETWORK_STR } from "../config/constants";

const cache = getDuneCache();

const CACHE_KEY = {
  VAULT_APR: "VAULT_APR",
};

// Dune 에서 사용하는 Query의 이름과 Id
// ID: query 편집 url 의 path 에 포함되어 있음
const QUERY = {
  // public
  Vault_Stats: 3251465,
  Trade_Stats: 3251396,
  Trade_Stats_By_Chain: 3295731,
  Daily_Stats: 3204175,
  Cumulative_Trade_Stats: 3197967,
  Open_Trade_by_Assets: 3239221,
  Trade_Volume_by_Assets: 3214590,
  Close_Trade_Stats: 3221707,
  Collateral_Ratio_Stats: 3239902,

  tx_fee_stats: 3502923,
  // eth_price_by_day: 3502807,
  // order_add_remove_col_stats: 3510597,
  // order_update_tp_sl_stats: 3510369,
  // open_trades: 3502741,
  // close_trades: 3502413,
  delegation_fees: 3502756,

  // private
  Private_Trader: 3226962,
};

let retryCount = 0;
const maxRetryCount = 10;

const DEFAULT_APR = {
  arbitrum: { cng_apr: 7, usdc_apr: 25 },
  zksync: { cng_apr: 7, usdc_apr: 25 },
};

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
  // 최근 실행 결과 가져오기
  const result: DuneExecutionResult = await getQueryResult(QUERY.Vault_Stats);
  if (!result.result || !result.result?.rows) {
    excuteAPRQuery();
    await cache.set(CACHE_KEY.VAULT_APR, DEFAULT_APR);
  }
  await parseAPR(result);
}

async function parseAPR(result: DuneExecutionResult) {
  if (
    !result ||
    !result.execution_id ||
    result.state == "QUERY_STATE_PENDING" ||
    !result.result ||
    !result.result?.rows
  ) {
    if (!result || !result.execution_id) {
      excuteAPRQuery();
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
      zksync: { cng_apr: zk_cng_apr, usdc_apr: zk_usdc_apr },
    };

    logger.info(
      "[Dune] Set arbi USDC_APR : " +
        arbi_usdc_apr +
        " arbi CNG_APR : " +
        arbi_cng_apr +
        " zk USDC_APR : " +
        zk_usdc_apr +
        " zk CNG_APR : " +
        zk_cng_apr
    );
    await cache.set(CACHE_KEY.VAULT_APR, aprs);
  } catch (error) {
    logger.error("[Dune] Error in getting execution result:", error);
    getExecutionResultWithDelay(result.execution_id, parseAPR);
    return false;
  }
  return true;
}

export async function excuteAPRQuery() {
  retryCount = 0;
  const ret = await executeQuery(QUERY.Vault_Stats);

  getExecutionResultWithDelay(ret.execution_id, parseAPR);
}

// API 실패했을 경우 최근 실행 결과를 다시 가져오는 함수
async function getExecutionResultWithDelay(executionId: string, callback: Function) {
  retryCount += 1;
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

// 쿼리 실행
export async function excuteDashboardQuery() {
  await executeQuery(QUERY.Vault_Stats); // Get APR
  await executeQuery(QUERY.Trade_Stats);
  await executeQuery(QUERY.Trade_Stats_By_Chain, { Chain: "ALL" });
  await executeQuery(QUERY.Daily_Stats);
  await executeQuery(QUERY.Cumulative_Trade_Stats);
  await executeQuery(QUERY.Open_Trade_by_Assets);
  await executeQuery(QUERY.Trade_Volume_by_Assets);
  await executeQuery(QUERY.Close_Trade_Stats);
}

export async function executeDashboardTwiceDailyQuery() {
  await executeQuery(QUERY.delegation_fees);
  await executeQuery(QUERY.tx_fee_stats);
}
