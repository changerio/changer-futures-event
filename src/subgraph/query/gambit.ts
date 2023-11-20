import { gql } from 'graphql-request';

export const GetPair = gql`
  query GetPair($id: ID!) {
    pair(id: $id) {
      id
      name
      from
      to
      confMultiplierP
      group {
        id
      }
      fee {
        id
      }
      feed {
        feed1
        feed2
        priceId1
        priceId2
        feedCalculation
        maxDeviationP
      }
      fundingFee {
        lastUpdateBlock
        accPerOiShort
        accPerOiLong
      }
      openInterest {
        long
        short
        max
      }
      param {
        fundingFeePerBlockP
        rolloverFeePerBlockP
      }
      rolloverFee {
        accPerCollateral
        lastUpdateBlock
      }
    }
  }
`;

export const GetPairs = gql`
query GetPairs {
  pairs {
    id
    name
    from
    to
    confMultiplierP
    fee {
      closeFeeP
      id
      minLevPosUsdc
      name
      nftLimitOrderFeeP
      openFeeP
      referralFeeP
    }
    feed {
      feed1
      feed2
      feedCalculation
      id
      maxDeviationP
      priceId1
      priceId2
    }
    rolloverFee {
      accPerCollateral
      id
      lastUpdateBlock
    }
    fundingFee {
      accPerOiLong
      accPerOiShort
      id
      lastUpdateBlock
    }
    group {
      id
      maxCollateralP
      maxLeverage
      minLeverage
      name
    }
    param {
      fundingFeePerBlockP
      id
      rolloverFeePerBlockP
    }
  }
}`

export const GetOpenTradesOfUser = gql`
query GetOpenTradesOfUser($id: ID!) {
    trader(id: $id) {
    openLimitOrder(first: 100) {
      maxPrice
      minPrice
    }
    openTrades(first: 100) {
      id
      tradeInfo {
        id
      }
      trade {
        buy
        id
        index
        openPrice
        leverage
        pairIndex
        positionSizeUsdc
        sl
        tp
      }
    }
  }
}`

export const GetOpenTradesOfUserWherePairIndex = gql`
query GetOpenTradesOfUser($id: ID!) {
    trader(id: $id, first: 1000) {
    openLimitOrder(first: 100) {
      maxPrice
      minPrice
    }
    openTrades(first: 100, where: {trade_: {index: $pairIndex}}) {
      id
      tradeInfo {
        id
      }
      trade {
        buy
        id
        index
        openPrice
        leverage
        pairIndex
        positionSizeUsdc
        sl
        tp
      }
    }
  }
}`

export const GetCloseTradesOfUser = gql`
  query GetCloseTradesOfUser($id: ID!) {
    trader(id: $id) {
      closeTradeCount
      closeTrades(first: 1000) {
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

export const GetCloseTradesOfUsers = gql`
  query GetCloseTradesOfUsers($first: Int!, $skip: Int!, $startTime: String!, $endTime: String!) {
    traders (first: $first, skip: $skip) {
      closeTradeCount
      id
      closeTrades(first: 1000, where: {reason_not: MARKET_OPEN_CANCELED, timestamp_gte: $startTime, timestamp_lt: $endTime}) {
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

export const GetCloseTradesOfUsersWhereTimestamp = gql`
  query GetCloseTradesOfUsersWhereTimestamp($first: Int!, $skip: Int!, $startTime: String!, $endTime: String!) {
    traders (first: $first, skip: $skip) {
      closeTradeCount
      id
      closeTrades(first: 1000, where: {timestamp_gte: $startTime, timestamp_lt: $endTime}) {
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

export const GetCloseTradesOfTraderOnlyProfit = gql`
  query GetCloseTradesOfTraderOnlyProfit($id: ID!) {
    trader(id: $id) {
      closeTradeCount
      closeTrades(where: {percentProfit_gt: "0"}, first: 1000) {
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

export const GetCloseTradesOfTradersOnlyProfit = gql`
  query GetCloseTradesOfTradersOnlyProfit {
    traders(where: {closeTrades_: {percentProfit_gt: "0"}}, first: 1000) {
      closeTradeCount
      id
      closeTrades(where: {percentProfit_gt: "0"}, first: 1000) {
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

export const GetCloseTradesWhereTimestamp = gql`
  query GetCloseTradesWhereTimestamp($first: Int!, $skip: Int!, $startTime: String!, $endTime: String!) {
    closeTrades(first: $first, skip: $skip, where: {timestamp_gte: $startTime, timestamp_lt: $endTime}) {
      id
      percentProfit
      usdcSentToTrader
      reason
      timestamp
      trader {
        id
      }
      trade {
        openPrice
        positionSizeUsdc
        index
        leverage
        pairIndex
        buy
        id
        sl
        tp
      }
    }
  }
`;