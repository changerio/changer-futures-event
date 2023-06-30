import { getCloseTradesOfTraderOver5000, getTradersOver5000, getCloseTradesOfTraderOnlyProfitForEvent, getCloseTradesOfTradersOnlyProfitForEvent, getCloseTradesOfUsersForEvent } from "../../src/subgraph/event";
import { getCloseTradesOfUsersAll } from "../subgraph/gambit";
import { getEventCache } from '../cache';
import { logger } from "../utils/logger";

const PNL_CACHE_KEY = 'pnl_ranking';
const TV_CACHE_KEY = 'tv_ranking';
const RANKING_CACHE_KEY = 'ranking_data';
const cache = getEventCache();
let TOP_25_PNL_TRADERS: RankingData[] = [];
let TOP_25_TV_TRADERS: RankingData[] = [];
let OPEN_EVENT_RANKING_DATA: { [key: string]: RankingData } = {};

interface RankingData {
    address: string,
    // tvRanking: number,
    // pnlRanking: number,
    tradeNumber: number,
    tv: number,
    pnl: number,
    onlyProfit: number,
    onlyLoss: number,
    avgLeverage: number,
    pnlPercent: number,
}

function createRankingData(address: string, tradeNumber: number, tv: number, pnl: number, onlyProfit: number, onlyLoss: number, avgLeverage: number, pnlPercent: number): RankingData {
    return { address, tradeNumber, tv, pnl, onlyProfit, onlyLoss, avgLeverage, pnlPercent };
}

// function createRankingData(trader): RankingData {
//     return { ...trader };
// }

export async function getCloseTradesOfTraderForTestnet9th(address: string) {
    const data = await getCloseTradesOfTraderOnlyProfitForEvent(address);
    const trader = data.trader;
    const pass = (trader && trader.closeTrades && trader.closeTrades.length > 0) ?? false;
    if (!pass) {
        return { pass, ...data }
    }

    for (let trade of trader.closeTrades) {
        // const percentProfit = parseFloat(trade.percentProfit) / 1e10;
        const usdcSentToTrader = parseFloat(trade.usdcSentToTrader.toString()) / 1e6;
        // const leverage = parseInt(trade.trade.leverage) //parseUnits(trade.leverage.toString(), USDC_DECIMAL);
        const positionSizeUsdc = parseFloat(trade.trade.positionSizeUsdc.toString()) / 1e6;//parseInt(trade.trade.positionSizeUsdc)//parseUnits(trade.positionSizeUsdc, USDC_DECIMAL);
        // const usdc = positionSizeUsdc / (1 - 0.08)
        // const pay = (positionSizeUsdc * leverage)
        // const profit = positionSizeUsdc * percentProfit / 100; // 거래손익
        const profit = usdcSentToTrader - positionSizeUsdc; // 최종손익 

        // console.log(percentProfit, usdcSentToTrader, leverage, positionSizeUsdc, usdc, pay, profit)
        if (profit > 5000) {
            return { pass, trade, ...data }
        }
    }

    return { pass: false, ...data };
}

export async function getTradersForTestnet9th(needDetail = true) {
    const data = await getCloseTradesOfTradersOnlyProfitForEvent();
    const traders = data.traders;
    const passTraders = traders.filter((trader => trader.closeTrades.length > 0));
    let passAddresses: string[] = [];
    for (let trader of passTraders) {
        for (let trade of trader.closeTrades) {
            const usdcSentToTrader = parseFloat(trade.usdcSentToTrader.toString()) / 1e6;
            const positionSizeUsdc = parseFloat(trade.trade.positionSizeUsdc.toString()) / 1e6;
            const profit = usdcSentToTrader - positionSizeUsdc; // 최종손익 
            if (profit > 5000) {
                passAddresses.push(trader.id);
                break;
            }
        }
    }

    if (needDetail) {
        return { size: passAddresses.length, passAddresses, origin: traders.length, ...data };
    } else {
        return { size: passAddresses.length, passAddresses, origin: traders.length };
    }
}

export async function getCloseTradesOfTraderForTestnet10th(address: string) {
    const data = await getCloseTradesOfTraderOnlyProfitForEvent(address);
    const trader = data.trader;
    const pass = (trader && trader.closeTrades && trader.closeTrades.length > 0) ?? false;
    if (!pass) {
        return { pass, ...data }
    }
    const profit = trader.closeTrades.reduce((accumulator, trade) => {
        const usdcSentToTrader = parseFloat(trade.usdcSentToTrader.toString()) / 1e6;
        const positionSizeUsdc = parseFloat(trade.trade.positionSizeUsdc.toString()) / 1e6;
        const profit = usdcSentToTrader - positionSizeUsdc; // 최종손익 
        return accumulator + profit;
    }, 0)
    console.log(profit);

    return { pass: profit >= 20000, profit, ...data };
}

export async function getTradersForTestnet10th(needDetail = true) {
    const data = await getCloseTradesOfTradersOnlyProfitForEvent();
    const traders = data.traders;

    let passedTraders: {}[] = [];
    let passAddresses: string[] = [];
    // const trader = data.trader;
    for (let trader of traders) {
        const pass = (trader && trader.closeTrades && trader.closeTrades.length > 0) ?? false;
        if (!pass) {
            continue;
        }
        const profit = trader.closeTrades.reduce((accumulator, trade) => {
            const usdcSentToTrader = parseFloat(trade.usdcSentToTrader.toString()) / 1e6;
            const positionSizeUsdc = parseFloat(trade.trade.positionSizeUsdc.toString()) / 1e6;
            const profit = usdcSentToTrader - positionSizeUsdc; // 최종손익 
            return accumulator + profit;
        }, 0)
        if (profit >= 20000) {
            passedTraders.push({ address: trader.id, profit });
            passAddresses.push(trader.id);
        }
    }

    if (needDetail) {
        return { size: passedTraders.length, passAddresses, passedTraders, origin: traders.length, ...data };
    } else {
        return { size: passedTraders.length, passAddresses, origin: traders.length };
    }
}

export async function getTestnetEvent910() {
    const ninth = await getTradersForTestnet9th(false);
    const tenth = await getTradersForTestnet10th(false);
    const bothAddresses = ninth.passAddresses.filter((address: string) => tenth.passAddresses.includes(address));
    const onlyNinthAddresses = ninth.passAddresses.filter((address: string) => !bothAddresses.includes(address));
    const onlyTenthAddresses = tenth.passAddresses.filter((address: string) => !bothAddresses.includes(address));

    const both = { size: bothAddresses.length, bothAddresses }
    const onlyNinth = { size: onlyNinthAddresses.length, onlyNinthAddresses }
    const onlyTenth = { size: onlyTenthAddresses.length, onlyTenthAddresses }
    return { ninth, tenth, both, onlyNinth, onlyTenth };
}

export async function getTestnetEventResult() {
    const data = await getCloseTradesOfUsersForEvent();
    const traders = data.traders;

    const count = { 0: traders.length, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    const third: string[] = [];
    const fourth: string[] = [];
    const fifth: string[] = [];
    const sixth: string[] = [];
    const seventh: string[] = [];
    const eighth: string[] = [];
    const ninth: string[] = [];
    const tenth: string[] = [];
    const addresses: string[] = [];
    for (let trader of traders) {
        if (!(trader && trader.closeTrades && trader.closeTrades.length > 0)) {
            continue;
        }
        const address = trader.id;
        addresses.push(address);
        for (let trade of trader.closeTrades) {

            const reason = trade.reason;
            const buy = trade.trade.buy;
            const usdcSentToTrader = parseFloat(trade.usdcSentToTrader.toString()) / 1e6;
            const positionSizeUsdc = parseFloat(trade.trade.positionSizeUsdc.toString()) / 1e6;
            const leverage = parseInt(trade.trade.leverage.toString())
            const pnl = usdcSentToTrader - positionSizeUsdc; // 최종손익 
            // 3th
            if (!third.includes(address) && buy) {
                third.push(address);
                count[3] += 1;
            }
            // 4th
            // if (!fourth.includes(address) && buy) {
            //     fourth.push(address);
            // }
            // 5th
            if (!fifth.includes(address) && buy && leverage == 10) {
                fifth.push(address);
                count[5] += 1;
            }
            // 6th
            if (!sixth.includes(address) && !buy && leverage == 10) {
                sixth.push(address);
                count[6] += 1;
            }
            // 7th
            if (!seventh.includes(address) && reason == 'TAKE_PROFIT') {
                seventh.push(address);
                count[7] += 1;
            }
            // 8th
            if (!eighth.includes(address) && reason == 'STOP_LOSS') {
                eighth.push(address);
                count[8] += 1;
            }
            // 9th
            if (!ninth.includes(address) && pnl > 5000) {
                ninth.push(address);
                count[9] += 1;
            }
        }

        // 10th
        const pass = (trader && trader.closeTrades && trader.closeTrades.length > 0) ?? false;
        if (!pass) {
            continue;
        }
        const profit = trader.closeTrades.filter((trade) => trade.percentProfit > 0).reduce((accumulator, trade) => {
            const usdcSentToTrader = parseFloat(trade.usdcSentToTrader.toString()) / 1e6;
            const positionSizeUsdc = parseFloat(trade.trade.positionSizeUsdc.toString()) / 1e6;
            const profit = usdcSentToTrader - positionSizeUsdc; // 최종손익 
            return accumulator + profit;
        }, 0)
        if (profit >= 20000) {
            tenth.push(address);
            count[10] += 1;
        }
    }
    return { count, third, fourth, fifth, sixth, seventh, eighth, ninth, tenth, addresses };
}

export async function getTestnetEventByAddress() {
    const { count, third, fourth, fifth, sixth, seventh, eighth, ninth, tenth, addresses } = await getTestnetEventResult();

    const ret = {};
    for (let address of addresses) {
        ret[address] = {
            3: third.includes(address),
            4: fourth.includes(address),
            5: fifth.includes(address),
            6: sixth.includes(address),
            7: seventh.includes(address),
            8: eighth.includes(address),
            9: ninth.includes(address),
            10: tenth.includes(address)
        };
    }

    return { count, ret };
}

async function getTraderCloseTradeStates() {
    const data = await getCloseTradesOfUsersAll();
    const traders: any = data.traders;
    logger.info(`trader number : ${traders.length}`);

    let traderStates: any[] = [];
    let profitUserCount = 0;
    let lossUserCount = 0;
    let totalPnl = 0;
    let totalTv = 0;
    // const trader = data.trader;
    for (let trader of traders) {
        if (!(trader && trader.closeTrades && trader.closeTrades.length > 0)) {
            traderStates.push({ address: trader.id, pnl: 0, onlyProfit: 0, onlyLoss: 0, tv: 0, message: "There are no closeTrades." });
        }
        let onlyProfit = 0;
        let onlyLoss = 0;
        let avgLeverage = 0;
        let tv = 0;
        let totalPositionSizeUsdc = 0;
        let sumPnlPercent = 0;
        for (let trade of trader.closeTrades) {
            const reason = trade.reason;
            const usdcSentToTrader = parseFloat(trade.usdcSentToTrader.toString()) / 1e6;
            const positionSizeUsdc = parseFloat(trade.trade.positionSizeUsdc.toString()) / 1e6;
            const leverage = parseInt(trade.trade.leverage.toString())
            const pnl = usdcSentToTrader - positionSizeUsdc; // 최종손익 
            totalPositionSizeUsdc += positionSizeUsdc;
            tv += positionSizeUsdc * leverage;
            avgLeverage += leverage;
            sumPnlPercent += pnl / positionSizeUsdc * 100;
            if (reason == 'TAKE_PROFIT' || (reason == 'CLOSE' && pnl > 0)) {
                onlyProfit += pnl;
            } else if (reason == 'LIQUIDATION' || reason == 'STOP_LOSS' || (reason == 'CLOSE' && pnl < 0)) {
                onlyLoss += pnl;
            }
        }
        const pnl = onlyProfit + onlyLoss;
        if (pnl > 0) {
            profitUserCount += 1
        } else {
            lossUserCount += 1
        }
        totalPnl += pnl;
        totalTv += tv;
        const tradeNumber = trader.closeTrades.length;
        avgLeverage = avgLeverage / tradeNumber;
        const pnlPercent = sumPnlPercent / tradeNumber;

        traderStates.push(createRankingData(trader.id, tradeNumber, tv, pnl, onlyProfit, onlyLoss, avgLeverage, pnlPercent));
    }
    return { traderStates, totalUserCount: traders.length, profitUserCount, lossUserCount, totalPnl, totalTv };
}

export async function getRankingOfTradingVolumeRealTime() {
    let { traderStates, totalUserCount, profitUserCount, lossUserCount, totalPnl, totalTv } = await getTraderCloseTradeStates();

    traderStates.sort((a, b) => b.tv - a.tv);
    const topTrader = traderStates.slice(0, 25);

    return { totalUserCount, profitUserCount, lossUserCount, totalPnl, totalTv, topTrader };
}

export async function getRankingOfPnlRealTime() {
    let { traderStates, totalUserCount, profitUserCount, lossUserCount, totalPnl, totalTv } = await getTraderCloseTradeStates();

    traderStates.sort((a, b) => b.pnl - a.pnl);
    const topTrader = traderStates.slice(0, 25);

    return { totalUserCount, profitUserCount, lossUserCount, totalPnl, totalTv, topTrader };
}

export async function setMainnetOpenEvent() {
    let { traderStates } = await getTraderCloseTradeStates();
    const pnlRanking = [...traderStates].sort((a, b) => b.pnlPercent - a.pnlPercent).map((trader, index) => ({ ...trader, pnlRanking: index + 1 }));
    TOP_25_PNL_TRADERS = pnlRanking.slice(0, 25);

    const tvRanking = [...traderStates].sort((a, b) => b.tv - a.tv).map((trader, index) => ({ ...trader, tvRanking: index + 1 }));
    TOP_25_TV_TRADERS = tvRanking.slice(0, 25);

    const pnlAndTvRanking = pnlRanking.sort((a, b) => b.tv - a.tv).map((trader, index) => ({ ...trader, tvRanking: index + 1 }));
    OPEN_EVENT_RANKING_DATA = pnlAndTvRanking.reduce((acc, current) => {
        acc[current.address] = current;
        return acc;
    }, {});

    await cache.set(PNL_CACHE_KEY, TOP_25_PNL_TRADERS);
    await cache.set(TV_CACHE_KEY, TOP_25_TV_TRADERS);
    await cache.set(RANKING_CACHE_KEY, OPEN_EVENT_RANKING_DATA);

    return { top25PnlTraders: TOP_25_PNL_TRADERS, top25TvTraders: TOP_25_TV_TRADERS };
}

export async function getRankingOfTradingVolume() {
    const topTraders = TOP_25_TV_TRADERS ?? await cache.get(TV_CACHE_KEY) ?? [];
    if (topTraders.length == 0) {
        await setMainnetOpenEvent();
        return TOP_25_TV_TRADERS;
    }

    return topTraders;
}

export async function getRankingOfPnl() {
    const topTraders = TOP_25_PNL_TRADERS ?? await cache.get(PNL_CACHE_KEY) ?? [];
    if (topTraders.length == 0) {
        await setMainnetOpenEvent();
        return TOP_25_PNL_TRADERS;
    }

    return topTraders;
}

export async function getRankingOfTrader(address: string) {
    if (!OPEN_EVENT_RANKING_DATA || Object.keys(OPEN_EVENT_RANKING_DATA).length === 0) {
        OPEN_EVENT_RANKING_DATA = await cache.get(RANKING_CACHE_KEY);
        if (!OPEN_EVENT_RANKING_DATA || Object.keys(OPEN_EVENT_RANKING_DATA).length === 0) {
            await setMainnetOpenEvent();
            return OPEN_EVENT_RANKING_DATA[address];
        }
    }

    return OPEN_EVENT_RANKING_DATA[address];
}