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
        onePercentDepthAbove
        rolloverFeePerBlockP
        onePercentDepthBelow
      }
      rolloverFee {
        accPerCollateral
        lastUpdateBlock
      }
    }
  }
`;

export const GetOpenTradesOfUser = gql`
query GetOpenTradesOfUser($id: ID!) {
    trader(id: $id) {
    openLimitOrder(first: 10) {
      maxPrice
      minPrice
    }
    openTrades(first: 10) {
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
        initialPosToken
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
    trader(id: $id) {
    openLimitOrder(first: 10) {
      maxPrice
      minPrice
    }
    openTrades(first: 10, where: {trade_: {index: $pairIndex}}) {
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
        initialPosToken
        pairIndex
        positionSizeUsdc
        sl
        tp
      }
    }
  }
}`