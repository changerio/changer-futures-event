import { getCloseTradesOfUsersAll, getCloseTradesWhereTimestampAll } from "../subgraph/gambit";
import { getEventCache } from '../cache';
import { logger } from "../utils/logger";

const PNL_CACHE_KEY = 'pnl_ranking';
const TV_CACHE_KEY = 'tv_ranking';
const RANKING_CACHE_KEY = 'ranking_data';
const END_TIMESTAMP = 'ranking_timestamp'; // 마지막 endtime
const cache = getEventCache();
let TOP_25_PNL_TRADERS: RankingInfo[] = [];
let TOP_25_TV_TRADERS: RankingInfo[] = [];
let OPEN_EVENT_RANKING_DATA: { [key: string]: RankingInfo } = {};
// let OPEN_EVENT_RANKING_DATA: Record<string, RankingInfo> = {};

interface RankingInfo {
    address: string,
    tradeNumber: number,
    tv: number,
    pnl: number,
    // onlyProfit: number,
    // onlyLoss: number,
    avgLeverage: number,
    avgPnlPercent: number,
    sumPnlPercent: number,
    pnlRanking: number,
    tvRanking: number,
}

function createRankingData(address: string, tradeNumber: number, tv: number, pnl: number, avgLeverage: number,
    avgPnlPercent: number, sumPnlPercent: number, tvRanking: number = -1, pnlRanking: number = -1): RankingInfo {
    return { address, tradeNumber, tv, pnl, avgLeverage, avgPnlPercent, sumPnlPercent, tvRanking, pnlRanking };
}

export async function upsertMainnetOpenEvent() {
    let rankingInfos: RankingInfo[];
    let startTimestamp: number = await cache.get(END_TIMESTAMP) ?? 0;
    if (!TOP_25_PNL_TRADERS || !TOP_25_TV_TRADERS || !OPEN_EVENT_RANKING_DATA || Object.keys(OPEN_EVENT_RANKING_DATA).length === 0) {
        TOP_25_PNL_TRADERS = await cache.get(PNL_CACHE_KEY);
        TOP_25_TV_TRADERS = await cache.get(TV_CACHE_KEY);
        OPEN_EVENT_RANKING_DATA = await cache.get(RANKING_CACHE_KEY);
        logger.info(`Read cache`);
    }

    if (startTimestamp === 0 || !TOP_25_PNL_TRADERS || !TOP_25_TV_TRADERS || !OPEN_EVENT_RANKING_DATA || Object.keys(OPEN_EVENT_RANKING_DATA).length === 0) {
        logger.info(`No cache. Update all trades`);
        rankingInfos = await makeRankingInfos();
    } else {
        logger.info(`Update only changes`);
        rankingInfos = await makeRankingInfosWhereTimestamp(startTimestamp);
        if (rankingInfos.length == 0) {
            return { pnlRanking: TOP_25_PNL_TRADERS, tvRanking: TOP_25_TV_TRADERS };
        }
    }

    return await saveMainnetOpenEvent(rankingInfos);
}

export async function setMainnetOpenEvent() {
    let rankingInfos: RankingInfo[] = await makeRankingInfos();
    return await saveMainnetOpenEvent(rankingInfos);
}

async function makeRankingInfos() {
    const data = await getCloseTradesOfUsersAll();
    const traders: any = data.traders;
    logger.info(`trader number : ${traders.length}`);
    let maxCloseTimestamp: number = 0;

    let rankingInfos: RankingInfo[] = [];
    for (let trader of traders) {
        if (!(trader && trader.closeTrades && trader.closeTrades.length > 0)) {
            rankingInfos.push(createRankingData(trader.id, 0, 0, 0, 0, 0, 0));
        }
        let sumLeverage = 0;
        let tv = 0;
        let sumPnlPercent = 0;
        let pnl = 0;
        for (let closeTrade of trader.closeTrades) {
            const usdcSentToTrader = parseFloat(closeTrade.usdcSentToTrader.toString()) / 1e6;
            const positionSizeUsdc = parseFloat(closeTrade.trade.positionSizeUsdc.toString()) / 1e6;
            const leverage = parseInt(closeTrade.trade.leverage.toString())
            const tradePnl = usdcSentToTrader - positionSizeUsdc; // 최종손익 
            sumLeverage += leverage;
            sumPnlPercent += closeTrade.percentProfit / 1e10 > -100 ? closeTrade.percentProfit / 1e10 : -100; // tradePnl / positionSizeUsdc * 100;
            tv += positionSizeUsdc * leverage;
            pnl += tradePnl;
            const tradeTimestamp = Number(closeTrade.timestamp);
            if (maxCloseTimestamp < tradeTimestamp) {
                maxCloseTimestamp = tradeTimestamp;
            }
        }
        const tradeNumber = trader.closeTrades.length;
        const avgLeverage = sumLeverage / tradeNumber;
        const avgPnlPercent = sumPnlPercent / tradeNumber;

        rankingInfos.push(createRankingData(trader.id, tradeNumber, tv, pnl, avgLeverage, avgPnlPercent, sumPnlPercent));
    }

    await cache.set(END_TIMESTAMP, maxCloseTimestamp + 1);
    return rankingInfos;
}

async function makeRankingInfosWhereTimestamp(startTimestamp: number) {
    const endTime: number = Math.round(Date.now() / 1000);
    const data = await getCloseTradesWhereTimestampAll(startTimestamp, endTime);
    if (!data.hasOwnProperty('closeTrades')) {
        logger.error(`Failed to get data from subgraph.`);
    }
    const closeTrades: any = data.closeTrades;
    logger.info(`closeTrades number : ${closeTrades.length}`);
    let maxCloseTimestamp: number = startTimestamp;
    if (closeTrades.length == 0) {
        logger.info(`Number of closeTrades is zero.`);
        return [];
    }

    for (let closeTrade of closeTrades) {
        const address = closeTrade.trader.id;
        const usdcSentToTrader = parseFloat(closeTrade.usdcSentToTrader.toString()) / 1e6;
        const positionSizeUsdc = parseFloat(closeTrade.trade.positionSizeUsdc.toString()) / 1e6;
        const leverage = parseInt(closeTrade.trade.leverage.toString())
        const tradePnl = usdcSentToTrader - positionSizeUsdc; // 최종손익 
        const pnlPercent = closeTrade.percentProfit / 1e10 > -100 ? closeTrade.percentProfit / 1e10 : -100; // tradePnl / positionSizeUsdc * 100;
        const tv = positionSizeUsdc * leverage;
        const pnl = tradePnl;

        if (!OPEN_EVENT_RANKING_DATA.hasOwnProperty(address)) {
            OPEN_EVENT_RANKING_DATA[address] = createRankingData(address, 0, 0, 0, 0, 0, 0);
        }

        const originTradeNumber = OPEN_EVENT_RANKING_DATA[address].tradeNumber;
        OPEN_EVENT_RANKING_DATA[address].tradeNumber += 1;
        OPEN_EVENT_RANKING_DATA[address].tv += tv;
        OPEN_EVENT_RANKING_DATA[address].pnl += pnl;
        OPEN_EVENT_RANKING_DATA[address].avgLeverage = (OPEN_EVENT_RANKING_DATA[address].avgLeverage * originTradeNumber + leverage) / (originTradeNumber + 1);
        OPEN_EVENT_RANKING_DATA[address].avgPnlPercent = (OPEN_EVENT_RANKING_DATA[address].avgPnlPercent * originTradeNumber + pnlPercent) / (originTradeNumber + 1);
        OPEN_EVENT_RANKING_DATA[address].sumPnlPercent += pnlPercent;
        const tradeTimestamp = Number(closeTrade.timestamp);

        if (maxCloseTimestamp < tradeTimestamp) {
            maxCloseTimestamp = tradeTimestamp;
        }
    }

    const rankingInfos: RankingInfo[] = Object.values(OPEN_EVENT_RANKING_DATA);
    await cache.set(END_TIMESTAMP, maxCloseTimestamp + 1);
    return rankingInfos;
}

export async function getRankingOfTradingVolumeRealTime() {
    let rankingInfos: RankingInfo[] = await makeRankingInfos();

    rankingInfos.filter((data) => data.tv > 0).sort((a, b) => b.tv - a.tv);
    const topTrader = rankingInfos.slice(0, 25);

    return topTrader;
}

export async function getRankingOfPnlRealTime() {
    let rankingInfos: RankingInfo[] = await makeRankingInfos();

    rankingInfos.filter((data) => data.tv > 0).sort((a, b) => b.sumPnlPercent - a.sumPnlPercent);
    const topTrader = rankingInfos.slice(0, 25);

    return topTrader;
}

async function saveMainnetOpenEvent(rankingInfos: RankingInfo[]) {
    const pnlRanking = rankingInfos.filter((data) => data.tv > 0).sort((a, b) => b.sumPnlPercent - a.sumPnlPercent).map((trader, index) => ({ ...trader, pnlRanking: index + 1 }));
    const tvRanking = rankingInfos.filter((data) => data.tv > 0).sort((a, b) => b.tv - a.tv).map((trader, index) => ({ ...trader, tvRanking: index + 1 }));

    TOP_25_PNL_TRADERS = pnlRanking.slice(0, 25);
    TOP_25_TV_TRADERS = tvRanking.slice(0, 25);
    const pnlAndTvRanking = combineLists(pnlRanking, tvRanking);
    OPEN_EVENT_RANKING_DATA = pnlAndTvRanking.reduce((acc, current) => {
        acc[current.address] = current;
        return acc;
    }, {});

    await cache.set(PNL_CACHE_KEY, TOP_25_PNL_TRADERS);
    await cache.set(TV_CACHE_KEY, TOP_25_TV_TRADERS);
    await cache.set(RANKING_CACHE_KEY, OPEN_EVENT_RANKING_DATA);

    return { pnlRanking, tvRanking };

    // return { top25PnlTraders: TOP_25_PNL_TRADERS, top25TvTraders: TOP_25_TV_TRADERS };
}

function combineLists(pnlRanking: any[], tvRanking: any[]): any[] {
    return pnlRanking.map((item1) => {
        const item2 = tvRanking.find((item) => item.address == item1.address);
        return { ...item1, tvRanking: item2.tvRanking };
    });
}

export async function getRankingOfTradingVolume() {
    if (!TOP_25_TV_TRADERS || TOP_25_TV_TRADERS.length === 0) {
        TOP_25_TV_TRADERS = await cache.get(TV_CACHE_KEY) ?? [];
        if (!TOP_25_TV_TRADERS || TOP_25_TV_TRADERS.length === 0) {
            await setMainnetOpenEvent();
        }
    }

    return TOP_25_TV_TRADERS;
}

export async function getRankingOfPnl() {
    if (!TOP_25_PNL_TRADERS || TOP_25_PNL_TRADERS.length === 0) {
        TOP_25_PNL_TRADERS = await cache.get(PNL_CACHE_KEY) ?? [];
        if (!TOP_25_PNL_TRADERS || TOP_25_PNL_TRADERS.length === 0) {
            await setMainnetOpenEvent();
        }
    }

    return TOP_25_PNL_TRADERS;
}

export async function getRankingOfTrader(address: string) {
    if (!OPEN_EVENT_RANKING_DATA || Object.keys(OPEN_EVENT_RANKING_DATA).length === 0) {
        OPEN_EVENT_RANKING_DATA = await cache.get(RANKING_CACHE_KEY);
        if (!OPEN_EVENT_RANKING_DATA || Object.keys(OPEN_EVENT_RANKING_DATA).length === 0) {
            await setMainnetOpenEvent();
        }
    }

    return OPEN_EVENT_RANKING_DATA[address];
}