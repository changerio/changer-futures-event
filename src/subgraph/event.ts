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

export async function getVaultDepositUser(address: string, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
    const result = await execute(query.GetVaultDepositUser, { id: address, startTime, endTime });
    return result;
}

export async function GetVaultDepositUserList(first: number = 1000, skip: number = 0, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
    const result = await execute(query.GetVaultDepositUserList, { first, skip, startTime, endTime });
    return result;
}

export async function getVaultDepositUserAll(startTime: number = 0, endTime: number = Math.round(Date.now() / 1000)) {
    const first: number = 1000;
    let skip: number = 0;

    let result = [];
    while (true) {
        const data = await GetVaultDepositUserList(first, skip, startTime.toString(), endTime.toString());
        if (!data.hasOwnProperty('traders')) {
            return data;
        }

        const { traders } = data;

        if (traders.length === 0) {
            break;
        }

        result = result.concat(traders);
        skip += first;
    }

    return result ;
}