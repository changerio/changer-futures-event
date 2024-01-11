import * as query from './query/gambit';
import { GraphQLCommon } from './common';

export class GambitGraphQL extends GraphQLCommon {
  constructor(url: string) {
    super(url);
  }

  public async getPair(id: number) {
    const result = await this.execute(query.GetPair, { id });
    return result;
  }

  public async getPairs() {
    const result = await this.execute(query.GetPairs, {});
    return result;
  }

  public async getOpenTradesOfUser(id: string) {
    const result = await this.execute(query.GetOpenTradesOfUser, { id });
    return result;
  }

  public async getOpenTradesOfUserWherePairIndex(id: string, pairIndex: number) {
    const result = await this.execute(query.GetOpenTradesOfUser, { id, pairIndex });
    return result;
  }

  public async getCloseTradesOfUser(address: string) {
    const result = await this.execute(query.GetCloseTradesOfUser, { id: address });
    return result;
  }

  public async getCloseTradesOfUsersAll(startTimestamp: string, endTimestamp: string) {
    const first: number = 1000;
    let skip: number = 0;

    let result = [];
    while (true) {
      const data = await this.getCloseTradesOfUsers(first, skip, startTimestamp, endTimestamp);
      const { traders } = data;

      if (traders.length === 0) {
        break;
      }

      result = result.concat(traders);
      skip += first;
    }

    return { traders: result };
  }

  public async getCloseTradesOfUsers(first: number = 1000, skip: number = 0, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
    const result = await this.execute(query.GetCloseTradesOfUsers, { first, skip, startTime, endTime });
    return result;
  }

  public async getCloseTradesOfTraderOnlyProfit(address: string) {
    const result = await this.execute(query.GetCloseTradesOfTraderOnlyProfit, { id: address });
    return result;
  }

  public async getCloseTradesOfTradersOnlyProfit() {
    const result = await this.execute(query.GetCloseTradesOfTradersOnlyProfit, {});
    return result;
  }

  public async GetCloseTradesOfUsersWhereTimestamp(first: number = 1000, skip: number = 0, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
    const result = await this.execute(query.GetCloseTradesOfUsersWhereTimestamp, { first, skip, startTime, endTime });
    return result;
  }

  public async getCloseTradesWhereTimestamp(first: number = 1000, skip: number = 0, startTime: string = "0", endTime: string = Math.round(Date.now() / 1000).toString()) {
    const result = await this.execute(query.GetCloseTradesWhereTimestamp, { first, skip, startTime, endTime });
    return result;
  }

  public async getCloseTradesWhereTimestampAll(startTimestamp: string = '0', endTimestamp: string = (Math.round(Date.now() / 1000)).toString()) {
    const first: number = 1000;
    let skip: number = 0;

    let result = [];
    while (true) {
      const data = await this.getCloseTradesWhereTimestamp(first, skip, startTimestamp, endTimestamp);
      if (!data.hasOwnProperty('closeTrades')) {
        return { closeTrades: [] };
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
}