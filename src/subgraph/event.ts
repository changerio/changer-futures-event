import { execute } from './common';
import * as query from './query/event';

export async function getCloseTradesOfTraderOver5000(address: string) {
    const result = await execute(query.GetCloseTradesOfTraderOver5000, { id: address });
    return result;
}

export async function getTradersOver5000() {
    const result = await execute(query.GetTradersOver5000, {});
    return result;
}

export async function getCloseTradesOfTraderOnlyProfitForEvent(address: string) {
    const result = await execute(query.GetCloseTradesOfTraderOnlyProfitForEvent, { id: address });
    return result;
}

export async function getCloseTradesOfTradersOnlyProfitForEvent() {
    const result = await execute(query.GetCloseTradesOfTradersOnlyProfitForEvent, {});
    return result;
}

export async function getCloseTradesOfUserForEvent(address: string) {
    const result = await execute(query.GetCloseTradesOfUserForEvent, { id: address });
    return result;
  }
  
  export async function getCloseTradesOfUsersForEvent() {
    const result = await execute(query.GetCloseTradesOfUsersForEvent, {});
    return result;
  }