import { gql } from 'graphql-request';

export const GetCloseTradesOfTraderOver5000 = gql`
  query GetCloseTradesOfTrader($id: ID!) {
    trader(id: $id) {
      closeTradeCount
      closeTrades(where: {usdcSentToTrader_gte: "5000000000", reason: TAKE_PROFIT}, first: 1000) {
        id
        usdcSentToTrader
        percentProfit
        reason
        trade {
          id
          leverage
          positionSizeUsdc
        }
      }
    }
  }
`;

export const GetTradersOver5000 = gql`
  query GetTradersOver5000 {
    traders(
      where: {closeTradeCount_gt: "0", closeTrades_: {usdcSentToTrader_gt: "5000000000"}}, first: 1000
    ) {
      closeTradeCount
      id
      closeTrades(where: {usdcSentToTrader_gte: "5000000000", reason: TAKE_PROFIT}, first: 1000) {
        id
        percentProfit
        usdcSentToTrader
        trade {
          id
          leverage
          positionSizeUsdc
        }
      }
    }
  }
`;

// 6/14 : 1686668400
// 6/13 : 1686625200
export const GetCloseTradesOfTraderOnlyProfitForEvent = gql`
  query GetCloseTradesOfTraderOnlyProfit($id: ID!) {
    trader(id: $id) {
      closeTradeCount
      closeTrades(where: {percentProfit_gt: "0", timestamp_lte: "1686668400"}, first: 1000) {
        id
        percentProfit
        usdcSentToTrader
        reason
        timestamp
        trade {
          id
          positionSizeUsdc
          leverage
        }
      }
    }
  }
`;

export const GetCloseTradesOfTradersOnlyProfitForEvent = gql`
  query GetCloseTradesOfTradersOnlyProfit {
    traders(where: {closeTrades_: {percentProfit_gt: "0"}}, first: 1000) {
      closeTradeCount
      id
      closeTrades(where: {percentProfit_gt: "0", timestamp_lte: "1686668400"}, first: 1000) {
        id
        percentProfit
        usdcSentToTrader
        reason
        trade {
          id
          positionSizeUsdc
          leverage
        }
      }
    }
  }
`;


export const GetCloseTradesOfUserForEvent = gql`
  query GetCloseTradesOfUserForEvent($id: ID!) {
    trader(id: $id) {
      closeTradeCount
      closeTrades(where: {timestamp_lte: "1686668400"}, first: 1000) {
        id
        percentProfit
        usdcSentToTrader
        reason
        trade {
          id
          positionSizeUsdc
          leverage
        }
      }
    }
  }
`;

export const GetCloseTradesOfUsersForEvent = gql`
  query GetCloseTradesOfUsersForEvent {
    traders (first: 1000) {
      closeTradeCount
      id
      closeTrades(where: {timestamp_lte: "1686668400"}, first: 1000) {
        id
        percentProfit
        usdcSentToTrader
        reason
        timestamp
        trade {
          openPrice
          positionSizeUsdc
          index
          leverage
          initialPosToken
          pairIndex
          buy
          id
          sl
          tp
        }
      }
    }
  }
`;

export const GetVaultDepositUser = gql`
query GetVaultEventUser($id: ID!, $startTime: String!, $endTime: String!) {
  trader(id: $id) {
    id
    depositShare
    depositAsset
    receiveShares(where: {timestamp_gte: $startTime, timestamp_lt: $endTime}) {
      id
      share
      asset
      timestamp
    }
    sendShares {
      id
      asset
      share
      timestamp
    }
  }
}
`

export const GetVaultDepositUserList = gql`
query GetVaultEventUser($first: Int!, $skip: Int!, $startTime: String!, $endTime: String!) {
  traders(first: $first, skip: $skip) {
    id
    depositShare
    depositAsset
    receiveShares(where: {timestamp_gte: $startTime, timestamp_lt: $endTime}) {
      id
      share
      asset
      timestamp
    }
    sendShares {
      id
      asset
      share
      timestamp
    }
  }
}
`