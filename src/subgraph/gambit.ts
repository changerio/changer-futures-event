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

export async function getCloseTradesOfUsersAll(skip: number = 0) {
  const first = 1000;

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
