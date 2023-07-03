import * as query from './query/gambit';
import { execute } from './common';

export async function getPair(id: number) {
  const result = await execute(query.GetPair, { id });
  return result;
}

export async function getOpenTradesOfUser(id: string) {
  const result = await execute(query.GetOpenTradesOfUser, { id });
  return result;
}

export async function getOpenTradesOfUserWherePairIndex(id: string, pairIndex: number) {
  const result = await execute(query.GetOpenTradesOfUser, { id, pairIndex });
  return result;
}

export async function getCloseTradesOfUser(address: string) {
  const result = await execute(query.GetCloseTradesOfUser, { id: address });
  return result;
}

export async function getCloseTradesOfUsersAll() {
  const first: number = 1000;
  let skip: number = 0;

  let result = [];
  while (true) {
    const data = await getCloseTradesOfUsers(first, skip);
    const { traders } = data;

    if (traders.length === 0) {
      break;
    }

    result = result.concat(traders);
    skip += first;
  }

  return { traders: result };
}

export async function getCloseTradesOfUsers(first: number = 1000, skip: number = 0) {
  const result = await execute(query.GetCloseTradesOfUsers, { first, skip });
  return result;
}

export async function getCloseTradesOfTraderOnlyProfit(address: string) {
  const result = await execute(query.GetCloseTradesOfTraderOnlyProfit, { id: address });
  return result;
}

export async function getCloseTradesOfTradersOnlyProfit() {
  const result = await execute(query.GetCloseTradesOfTradersOnlyProfit, {});
  return result;
}

export async function GetCloseTradesOfUsersWhereTimestamp(first: number = 1000, skip: number = 0, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
  const result = await execute(query.GetCloseTradesOfUsersWhereTimestamp, { first, skip, startTime, endTime });
  return result;
}

export async function getCloseTradesWhereTimestamp(first: number = 1000, skip: number = 0, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
  const result = await execute(query.GetCloseTradesWhereTimestamp, { first, skip, startTime, endTime });
  return result;
}

export async function getCloseTradesWhereTimestampAll(startTime: number = 0, endTime: number = Math.round(Date.now() / 1000)) {
  const first: number = 1000;
  let skip: number = 0;

  let result = [];
  while (true) {
    const data = await getCloseTradesWhereTimestamp(first, skip, startTime.toString(), endTime.toString());
    if (!data.hasOwnProperty('closeTrades')) {
      return data;
    }

    const { closeTrades } = data;

    if (closeTrades.length === 0) {
      break;
    }

    result = result.concat(closeTrades);
    skip += first;
  }

  return { closeTrades: result };
}