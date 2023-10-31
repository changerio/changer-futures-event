import { GraphQLCommon } from './common';
import * as query from './query/event';

export class EventGraphQL extends GraphQLCommon {
    constructor(url: string) {
        super(url);
    }

    public async getCloseTradesOfTraderOver5000(address: string) {
        const result = await this.execute(query.GetCloseTradesOfTraderOver5000, { id: address });
        return result;
    }

    public async getTradersOver5000() {
        const result = await this.execute(query.GetTradersOver5000, {});
        return result;
    }

    public async getCloseTradesOfTraderOnlyProfitForEvent(address: string) {
        const result = await this.execute(query.GetCloseTradesOfTraderOnlyProfitForEvent, { id: address });
        return result;
    }

    public async getCloseTradesOfTradersOnlyProfitForEvent() {
        const result = await this.execute(query.GetCloseTradesOfTradersOnlyProfitForEvent, {});
        return result;
    }

    public async getCloseTradesOfUserForEvent(address: string) {
        const result = await this.execute(query.GetCloseTradesOfUserForEvent, { id: address });
        return result;
    }

    public async getCloseTradesOfUsersForEvent() {
        const result = await this.execute(query.GetCloseTradesOfUsersForEvent, {});
        return result;
    }

    public async getVaultDepositUser(address: string, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
        const result = await this.execute(query.GetVaultDepositUser, { id: address, startTime, endTime });
        return result;
    }

    public async GetVaultDepositUserList(first: number = 1000, skip: number = 0, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
        const result = await this.execute(query.GetVaultDepositUserList, { first, skip, startTime, endTime });
        return result;
    }

    public async getVaultDepositUserAll(startTime: number = 0, endTime: number = Math.round(Date.now() / 1000)) {
        const first: number = 1000;
        let skip: number = 0;

        let result = [];
        while (true) {
            const data = await this.GetVaultDepositUserList(first, skip, startTime.toString(), endTime.toString());
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

        return result;
    }
};