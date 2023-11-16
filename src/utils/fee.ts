import { SUBGRAPHS, ARBITRUM_NETWORK_STR, ZKSYNCERA_NETWORK_STR, ALL_NETWORK_STR } from "../config/constants";



export function zeroFeePatched(closeTrade) {
  if(closeTrade.timestamp > 1699601767) {
    return true;
  }

  return false;
}

export function getOpenFeeP(network:string, closeTrade) {

  if(zeroFeePatched(closeTrade)) {
    return 0;
  } else {
    return 0.0004;
  }
}

export function getCloseFeeP(network:string, closeTrade) {

  if(zeroFeePatched(closeTrade)) {
    if(network === ARBITRUM_NETWORK_STR) {
      // crypto: 0.04% = 0.03% usdc + 0.01% cng staker
      // forex: 0.006% = 0.0045% usdc + 0.0015% cng staker
      return isForex(closeTrade) ? 0.00006 : 0.0004; 
    } else {
      // zksync
      // crypto: 0.04% = 0.04% usdc staker
      // forex: 0.006% = 0.006% usdc staker
      return isForex(closeTrade) ? 0.00006 : 0.0004;
    }
  } else {
    if(network === ARBITRUM_NETWORK_STR) {
      // crypto: 0.06% = 0.04% usdc + 0.02% cng staker
      // forex: 0.009% = 0.006% usdc + 0.003% cng staker
      return isForex(closeTrade) ? 0.00009 : 0.0006;
    } else {
      // zkSync 
      // crypto: 0.04% = 0.04% usdc staker
      // forex: 0.006% = 0.006% usdc staker
      return isForex(closeTrade) ? 0.00006 : 0.0004;
    }
  }
}

export function isForex(closeTrade) {
  if (closeTrade.trade.pairIndex == 4 || closeTrade.trade.pairIndex == 5 || closeTrade.trade.pairIndex == 6) {
    return true;
  }
  else 
    return false;
}