import { GambitGraphQL } from "../subgraph/gambit";
import { getEventCache } from '../cache';
import { logger } from "../utils/logger";
import { getOpenFeeP, getCloseFeeP } from "../utils/fee";
import { ARBITRUM_NETWORK_STR, ZKSYNCERA_NETWORK_STR, ALL_NETWORK_STR } from "../config/constants";
import config from "../config/default";

const arbitrumGraphQL: GambitGraphQL = new GambitGraphQL(config.subgraph.arbitrum);
const zksyncEraGraphQL: GambitGraphQL = new GambitGraphQL(config.subgraph.zksync);
const targetGraphQL = [arbitrumGraphQL, zksyncEraGraphQL];
logger.info(`trading event target: \n- arbitrum: ${config.subgraph.arbitrum}\n- zksyncEra: ${config.subgraph.zksync}`);

const START_TIMESTAMP = {
    MAIN: '1698969600', // 2023년 11월 3일 0시 0분 0초 (UTC+0)
    Week00: '1704844800', // 2024년 1월 10일 0시 0분 0초 (UTC+0) for test
    Week01: '1705017600', // 2024년 1월 12일 0시 0분 0초 (UTC+0) for test
    Week1: '1705449600', // 2024년 1월 17일 0시 0분 0초 (UTC+0)
    Week2: '1706054400', // 2024년 1월 24일 0시 0분 0초 (UTC+0)
    Week3: '1706659200', // 2024년 1월 31일 0시 0분 0초 (UTC+0)
}
const END_TIMESTAMP = {
    MAIN: '1704499200', // 2024년 1월 6일 0시 0분 0초 (UTC+0)
    Week00: '1705017600', // 2024년 1월 12일 0시 0분 0초 (UTC+0) for test
    Week01: '1705449600', // 2024년 1월 17일 0시 0분 0초 (UTC+0) for test
    Week1: '1706054400', // 2024년 1월 24일 0시 0분 0초 (UTC+0)
    Week2: '1706659200', // 2024년 1월 31일 0시 0분 0초 (UTC+0)
    Week3: '1707264000', // 2024년 2월 7일 0시 0분 0초 (UTC+0)
}

const cache = getEventCache();
const END_TIMESTAMP_KEY = 'ranking_timestamp'; // 마지막 endtime

const PNL_CACHE_KEY = 'pnl_ranking';
const TV_CACHE_KEY = 'tv_ranking';
const RANKING_CACHE_KEY = 'ranking_data';

let WEEKLY_EVENT_TARGET: string;
let WEEKLY_PNL_CACHE_KEY: string;
let WEEKLY_TV_CACHE_KEY: string;
let WEEKLY_RANKING_CACHE_KEY: string;

let TOP_25_PNL_TRADERS: RankingInfo[] = [];
let TOP_25_TV_TRADERS: RankingInfo[] = [];
let TRADING_EVENT_RANKING_DATA: { [key: string]: RankingInfo } = {};
let maxCloseTimestamp = 0;

interface RankingInfo {
    address: string,
    tradeCount: number,
    tv: number,
    pnl: number,
    avgLeverage: number,
    avgPnlPercent: number,
    sumPnlPercent: number,
    pnlRanking: number,
    tvRanking: number,
}

function createRankingData(address: string, tradeCount: number, tv: number, pnl: number, avgLeverage: number,
    avgPnlPercent: number, sumPnlPercent: number, tvRanking: number = -1, pnlRanking: number = -1): RankingInfo {
    return { address, tradeCount, tv, pnl, avgLeverage, avgPnlPercent, sumPnlPercent, tvRanking, pnlRanking };
}

function isForex(pairIndex: string) {
    return pairIndex == "4" || pairIndex == "5" || pairIndex == "6" || pairIndex == "7";
}

export function setWeeklyEventTarget() {
    const now = Math.round(Date.now() / 1000);
    if (now >= parseInt(START_TIMESTAMP.Week00) && now < parseInt(END_TIMESTAMP.Week00)) {
        WEEKLY_EVENT_TARGET = 'Week00'; // test
    } else if (now >= parseInt(START_TIMESTAMP.Week1) && now < parseInt(END_TIMESTAMP.Week1)) {
        WEEKLY_EVENT_TARGET = 'Week01'; // test
    } else if (now >= parseInt(START_TIMESTAMP.Week1) && now < parseInt(END_TIMESTAMP.Week1)) {
        WEEKLY_EVENT_TARGET = 'Week1';
    } else if (now >= parseInt(START_TIMESTAMP.Week2) && now < parseInt(END_TIMESTAMP.Week2)) {
        WEEKLY_EVENT_TARGET = 'Week2';
    } else if (now >= parseInt(START_TIMESTAMP.Week3) && now < parseInt(END_TIMESTAMP.Week3)) {
        WEEKLY_EVENT_TARGET = 'Week3';
    } else {
        WEEKLY_EVENT_TARGET = 'END';
    }
    WEEKLY_PNL_CACHE_KEY = PNL_CACHE_KEY + "_" + WEEKLY_EVENT_TARGET;
    WEEKLY_TV_CACHE_KEY = TV_CACHE_KEY + "_" + WEEKLY_EVENT_TARGET;
    WEEKLY_RANKING_CACHE_KEY = RANKING_CACHE_KEY + "_" + WEEKLY_EVENT_TARGET;
    logger.info(`[setWeeklyEventTarget] now: ${now} | target: ${WEEKLY_EVENT_TARGET}`);
    return WEEKLY_EVENT_TARGET;
}

export function getWeeklyEventTarget() {
    if (!WEEKLY_EVENT_TARGET) {
        setWeeklyEventTarget();
    }
    return WEEKLY_EVENT_TARGET;
}

export async function upsertTradingEvent() {
    let rankingInfos: RankingInfo[];
    let startTimestamp: string = await cache.get(END_TIMESTAMP_KEY) ?? '0';
    const target = getWeeklyEventTarget();

    if (!TOP_25_PNL_TRADERS || !TOP_25_TV_TRADERS || !TRADING_EVENT_RANKING_DATA || Object.keys(TRADING_EVENT_RANKING_DATA).length === 0) {
        TOP_25_PNL_TRADERS = await cache.get(WEEKLY_PNL_CACHE_KEY);
        TOP_25_TV_TRADERS = await cache.get(WEEKLY_TV_CACHE_KEY);
        TRADING_EVENT_RANKING_DATA = await cache.get(WEEKLY_RANKING_CACHE_KEY);
        logger.info(`Read cache`);
    }

    if (startTimestamp === '0' || !TOP_25_PNL_TRADERS || !TOP_25_TV_TRADERS || !TRADING_EVENT_RANKING_DATA || Object.keys(TRADING_EVENT_RANKING_DATA).length === 0) {
        logger.info(`No cache. Update all trades`);
        const traders: any = await getTradersWithCloseTrades(ALL_NETWORK_STR, START_TIMESTAMP[target], END_TIMESTAMP[target]);
        rankingInfos = await makeRankingInfos(traders);
    } else {
        logger.info(`Update only changes`);
        const closeTrades: any = await getCloseTrades(ALL_NETWORK_STR, startTimestamp);
        rankingInfos = await updateRankingInfosFromCloseTrades(closeTrades);
        if (rankingInfos.length == 0) {
            return { pnlRanking: TOP_25_PNL_TRADERS, tvRanking: TOP_25_TV_TRADERS };
        }
    }

    return await saveTradingEventRanking(rankingInfos);
}

export async function setMainnetOpenEvent() {
    const traders: any = await getTradersWithCloseTrades(ALL_NETWORK_STR, START_TIMESTAMP.MAIN, END_TIMESTAMP.MAIN);
    let rankingInfos: RankingInfo[] = await makeRankingInfos(traders);
    return await saveTradingEventRanking(rankingInfos);
}

export async function setWeeklyTradingEvent() {
    const originTarget = WEEKLY_EVENT_TARGET;
    setWeeklyEventTarget();
    if (WEEKLY_EVENT_TARGET == 'END') {
        return;
    } else if (originTarget != WEEKLY_EVENT_TARGET) {
        TOP_25_PNL_TRADERS = [];
        TOP_25_TV_TRADERS = [];
        TRADING_EVENT_RANKING_DATA = {};
    }
    const traders: any = await getTradersWithCloseTrades(ALL_NETWORK_STR, START_TIMESTAMP[WEEKLY_EVENT_TARGET], END_TIMESTAMP[WEEKLY_EVENT_TARGET]);
    let rankingInfos: RankingInfo[] = await makeRankingInfos(traders);
    return await saveTradingEventRanking(rankingInfos);
}

function _parseCloseTrades(network: string, traders, isAggregate: boolean, ret: Map<String, { tradeVolume: number, tradeNum: number, newTrader: number, pnl: number, toTreasury: number, closeFee: number, openFee: number }>) {
    for (let trader of traders) {
        for (let closeTrade of trader.closeTrades) {
            const usdcSentToTrader = parseFloat(closeTrade.usdcSentToTrader.toString()) / 1e6;
            const positionSizeUsdc = parseFloat(closeTrade.trade.positionSizeUsdc.toString()) / 1e6;
            const leverage = parseFloat(closeTrade.trade.leverage.toString()) / 1e18;
            const tradePnl = usdcSentToTrader - positionSizeUsdc; // 최종손익 
            const tradingVolume = positionSizeUsdc * leverage;
            const tradeTimestamp = Number(closeTrade.timestamp);
            const date = new Date(tradeTimestamp * 1000);
            let key = "";
            if (isAggregate) {
                key = `${pad0ToNum(date.getFullYear())}.${pad0ToNum(date.getMonth() + 1)}.${pad0ToNum(date.getDate())}`;
            } else {
                key = `${tradeTimestamp}-${closeTrade.id}`;
            }

            if (!ret.has(key)) {
                ret.set(key, { tradeVolume: 0, tradeNum: 0, newTrader: 0, pnl: 0, toTreasury: 0, closeFee: 0, openFee: 0 });
            }

            const item = ret.get(key);
            if (item) {
                // check new user
                const isNewTrader = closeTrade.id.endsWith("-0") ? 1 : 0;

                item.newTrader += isNewTrader;
                item.tradeVolume += tradingVolume;
                item.pnl += tradePnl;
                item.tradeNum += 1;

                let toTreasury = 0;
                let closeFee = 0;
                let openFeeP = getOpenFeeP(network, closeTrade);
                let closeFeeP = getCloseFeeP(network, closeTrade);

                const openFee = tradingVolume * openFeeP;

                // liquidation
                if (-tradePnl > positionSizeUsdc * 0.9) {
                    closeFee = positionSizeUsdc * 0.05;
                    toTreasury = -tradePnl - closeFee;
                } else {
                    //close trade
                    closeFee = tradingVolume * closeFeeP;

                    if (tradePnl + closeFee < 0 && tradePnl >= 0) {
                        toTreasury = (tradePnl + closeFee);
                    } else {
                        toTreasury = -(tradePnl + closeFee);
                    }
                }

                if (isAggregate) {
                    item.toTreasury += toTreasury;
                    item.closeFee += closeFee;
                    item.openFee += openFee;

                    ret.set(key, item);
                } else {
                    ret.set(key, { tradeVolume: tradingVolume, tradeNum: 1, newTrader: isNewTrader, pnl: tradePnl, toTreasury, closeFee, openFee });
                }
            }
        }
    }
}

export async function getDailyCloseTrade(chain: string, isAggregate: boolean = true, isCsv: boolean = true) {
    // tv & num
    const ret = new Map<String, { tradeVolume: number, tradeNum: number, newTrader: number, pnl: number, toTreasury: number, closeFee: number, openFee: number }>()

    if (chain === ARBITRUM_NETWORK_STR || chain === ALL_NETWORK_STR) {
        const arbi_traders: any = await getTradersWithCloseTrades(ARBITRUM_NETWORK_STR, '0', Math.round(Date.now() / 1000).toString());
        _parseCloseTrades(ARBITRUM_NETWORK_STR, arbi_traders, isAggregate, ret);
    }

    if (chain === ZKSYNCERA_NETWORK_STR || chain === ALL_NETWORK_STR) {
        const zk_traders: any = await getTradersWithCloseTrades(ZKSYNCERA_NETWORK_STR, '0', Math.round(Date.now() / 1000).toString());
        _parseCloseTrades(ZKSYNCERA_NETWORK_STR, zk_traders, isAggregate, ret);
    }

    if (isCsv) {
        const retCSV: string[] = [];
        ret.forEach((value: { tradeVolume: number, tradeNum: number, newTrader: number, pnl: number, toTreasury: number, closeFee: number, openFee: number }, key: String) => {
            retCSV.push(`${key},${value.tradeNum},${value.tradeVolume},${value.newTrader},${value.pnl},${value.toTreasury},${value.closeFee},${value.openFee}`)
        });

        retCSV.sort((a, b) => {
            const timestamp1 = a.split(',')[0];
            const timestamp2 = b.split(',')[0];

            if (timestamp1 < timestamp2) return -1;
            else return 0;
        })

        return (isAggregate ? "Date" : "timestamp-TradeId") + ",tradeNum,tradeVolume,newTrader,traderPnL,Treasury,CloseFee,OpenFee\n" + retCSV.join("\n");
    }

    const toObj = Object.fromEntries(ret);

    return Object.keys(toObj).sort().reduce((result, key) => ((result[key] = toObj[key]), result), {});
}

async function makeRankingInfos(traders) {
    let totalTv = 0;
    let totalTradeCount = 0;

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
            if (closeTrade.id == '0xa9b2cbfab2b8be5e080a1a352c5b7de9627192ef-2' && closeTrade.timestamp == 1703486957) {
                continue; // LIQUIDATION
            }
            const usdcSentToTrader = parseFloat(closeTrade.usdcSentToTrader.toString()) / 1e6;
            const positionSizeUsdc = parseFloat(closeTrade.trade.positionSizeUsdc.toString()) / 1e6;
            const leverage = parseFloat(closeTrade.trade.leverage.toString()) / 1e18;
            const tradePnl = usdcSentToTrader - positionSizeUsdc; // 최종손익 
            sumLeverage += leverage;
            sumPnlPercent += closeTrade.percentProfit / 1e10 > -100 ? closeTrade.percentProfit / 1e10 : -100; // tradePnl / positionSizeUsdc * 100;
            tv += isForex(closeTrade.trade.pairIndex) ? (positionSizeUsdc * leverage * 0.125) : positionSizeUsdc * leverage; // forex 0.006 | cryto 0.04
            // tv += positionSizeUsdc * leverage; // origin
            pnl += tradePnl;
            const tradeTimestamp = Number(closeTrade.timestamp);
            if (maxCloseTimestamp < tradeTimestamp) {
                maxCloseTimestamp = tradeTimestamp;
            }
        }
        const tradeCount = trader.closeTrades.length;
        const avgLeverage = sumLeverage / tradeCount;
        const avgPnlPercent = sumPnlPercent / tradeCount;

        rankingInfos.push(createRankingData(trader.id, tradeCount, tv, pnl, avgLeverage, avgPnlPercent, sumPnlPercent));
        totalTv += tv;
        totalTradeCount += trader.closeTrades.length;
    }
    logger.info(`trader number : ${traders.length}`);
    logger.info(`totalTv : ${totalTv}`);
    logger.info(`totalTradeCount : ${totalTradeCount}`);

    return rankingInfos;
}

async function makeRankingInfosFromCloseTrades(closeTrades) {
    logger.info(`[makeRankingInfosFromCloseTrades] closeTrades count : ${closeTrades.length}`);
    if (closeTrades.length == 0) {
        return [];
    }

    let rankingMap = {};
    for (let closeTrade of closeTrades) {
        const address = closeTrade.trader.id;
        const usdcSentToTrader = parseFloat(closeTrade.usdcSentToTrader.toString()) / 1e6;
        const positionSizeUsdc = parseFloat(closeTrade.trade.positionSizeUsdc.toString()) / 1e6;
        const leverage = parseFloat(closeTrade.trade.leverage.toString()) / 1e18;
        const tradePnl = usdcSentToTrader - positionSizeUsdc; // 최종손익 
        const pnlPercent = closeTrade.percentProfit / 1e10 > -100 ? closeTrade.percentProfit / 1e10 : -100; // tradePnl / positionSizeUsdc * 100;
        const tv = isForex(closeTrade.trade.pairIndex) ? (positionSizeUsdc * leverage * 0.125) : positionSizeUsdc * leverage; // fores 0.006 | cryto 0.04
        const pnl = tradePnl;

        if (!rankingMap.hasOwnProperty(address)) {
            rankingMap[address] = createRankingData(address, 0, 0, 0, 0, 0, 0);
        }

        const originTradeCount = rankingMap[address].tradeCount;
        rankingMap[address].tradeCount += 1;
        rankingMap[address].tv += tv;
        rankingMap[address].pnl += pnl;
        rankingMap[address].avgLeverage = (rankingMap[address].avgLeverage * originTradeCount + leverage) / (originTradeCount + 1);
        rankingMap[address].avgPnlPercent = (rankingMap[address].avgPnlPercent * originTradeCount + pnlPercent) / (originTradeCount + 1);
        rankingMap[address].sumPnlPercent += pnlPercent;
        const tradeTimestamp = Number(closeTrade.timestamp);

        if (maxCloseTimestamp < tradeTimestamp) {
            maxCloseTimestamp = tradeTimestamp;
        }
    }

    const rankingInfos: RankingInfo[] = Object.values(rankingMap);
    return rankingInfos;
}

async function updateRankingInfosFromCloseTrades(closeTrades) {
    logger.info(`[updateRankingInfosFromCloseTrades] closeTrades count : ${closeTrades.length}`);
    if (closeTrades.length == 0) {
        return [];
    }

    for (let closeTrade of closeTrades) {
        const address = closeTrade.trader.id;
        const usdcSentToTrader = parseFloat(closeTrade.usdcSentToTrader.toString()) / 1e6;
        const positionSizeUsdc = parseFloat(closeTrade.trade.positionSizeUsdc.toString()) / 1e6;
        const leverage = parseFloat(closeTrade.trade.leverage.toString()) / 1e18;
        const tradePnl = usdcSentToTrader - positionSizeUsdc; // 최종손익 
        const pnlPercent = closeTrade.percentProfit / 1e10 > -100 ? closeTrade.percentProfit / 1e10 : -100; // tradePnl / positionSizeUsdc * 100;
        const tv = isForex(closeTrade.trade.pairIndex) ? (positionSizeUsdc * leverage * 0.125) : positionSizeUsdc * leverage; // fores 0.006 | cryto 0.04
        const pnl = tradePnl;

        if (!TRADING_EVENT_RANKING_DATA.hasOwnProperty(address)) {
            TRADING_EVENT_RANKING_DATA[address] = createRankingData(address, 0, 0, 0, 0, 0, 0);
        }

        const originTradeCount = TRADING_EVENT_RANKING_DATA[address].tradeCount;
        TRADING_EVENT_RANKING_DATA[address].tradeCount += 1;
        TRADING_EVENT_RANKING_DATA[address].tv += tv;
        TRADING_EVENT_RANKING_DATA[address].pnl += pnl;
        TRADING_EVENT_RANKING_DATA[address].avgLeverage = (TRADING_EVENT_RANKING_DATA[address].avgLeverage * originTradeCount + leverage) / (originTradeCount + 1);
        TRADING_EVENT_RANKING_DATA[address].avgPnlPercent = (TRADING_EVENT_RANKING_DATA[address].avgPnlPercent * originTradeCount + pnlPercent) / (originTradeCount + 1);
        TRADING_EVENT_RANKING_DATA[address].sumPnlPercent += pnlPercent;
        const tradeTimestamp = Number(closeTrade.timestamp);

        if (maxCloseTimestamp < tradeTimestamp) {
            maxCloseTimestamp = tradeTimestamp;
        }
    }

    const rankingInfos: RankingInfo[] = Object.values(TRADING_EVENT_RANKING_DATA);
    return rankingInfos;
}

export async function getRankingOfTradingVolumeRealTime(chain: string, startTimestamp: string, endTimestamp: string, isCsv: boolean = false) {
    let rankingInfos: RankingInfo[];
    if (startTimestamp != '0') {
        const closeTrades: any = await getCloseTrades(chain, startTimestamp, endTimestamp);
        rankingInfos = await makeRankingInfosFromCloseTrades(closeTrades);
    } else {
        const traders: any = await getTradersWithCloseTrades(chain, startTimestamp, endTimestamp);
        rankingInfos = await makeRankingInfos(traders);
    }

    const tvRanking = rankingInfos.filter((data) => data.tv > 0).sort((a, b) => b.tv - a.tv).map((trader, index) => ({ ...trader, tvRanking: index + 1 }));
    // const topTrader = tvRanking.slice(0, 100);

    if (isCsv) {
        const retCSV: string[] = [];
        tvRanking.forEach((trader) => retCSV.push(`${trader.address},${trader.tradeCount},${trader.tv},${trader.pnl},${trader.avgLeverage},${trader.avgPnlPercent},${trader.sumPnlPercent},${trader.tvRanking},${trader.pnlRanking}`))
        return "address,tradeCount,tv,pnl,avgLeverage,avgPnlPercent,sumPnlPercent,tvRanking,pnlRanking\n" + retCSV.join("\n");
    }

    return tvRanking; //topTrader;
}

export async function getRankingOfPnlRealTime(chain: string, startTimestamp: string, endTimestamp: string, isCsv: boolean = false) {
    let rankingInfos: RankingInfo[];
    if (startTimestamp != '0') {
        const closeTrades: any = await getCloseTrades(chain, startTimestamp, endTimestamp);
        rankingInfos = await makeRankingInfosFromCloseTrades(closeTrades);
    } else {
        const traders: any = await getTradersWithCloseTrades(chain, startTimestamp, endTimestamp);
        rankingInfos = await makeRankingInfos(traders);
    }

    const pnlRanking = rankingInfos.filter((data) => data.tv > 0).sort((a, b) => b.sumPnlPercent - a.sumPnlPercent).map((trader, index) => ({ ...trader, pnlRanking: index + 1 }));
    //const topTrader = pnlRanking.slice(0, 100);

    if (isCsv) {
        const retCSV: string[] = [];
        pnlRanking.forEach((trader) => retCSV.push(`${trader.address},${trader.tradeCount},${trader.tv},${trader.pnl},${trader.avgLeverage},${trader.avgPnlPercent},${trader.sumPnlPercent},${trader.tvRanking},${trader.pnlRanking}`))
        return "address,tradeCount,tv,pnl,avgLeverage,avgPnlPercent,sumPnlPercent,tvRanking,pnlRanking\n" + retCSV.join("\n");
    }

    return pnlRanking; //topTrader;
}

async function saveTradingEventRanking(rankingInfos: RankingInfo[]) {
    const pnlRanking = rankingInfos.filter((data) => data.tv > 0).sort((a, b) => b.sumPnlPercent - a.sumPnlPercent).map((trader, index) => ({ ...trader, pnlRanking: index + 1 }));
    const tvRanking = rankingInfos.filter((data) => data.tv > 0).sort((a, b) => b.tv - a.tv).map((trader, index) => ({ ...trader, tvRanking: index + 1 }));

    TOP_25_PNL_TRADERS = pnlRanking.slice(0, 25);
    TOP_25_TV_TRADERS = tvRanking.slice(0, 25);
    const pnlAndTvRanking = combineLists(pnlRanking, tvRanking);
    TRADING_EVENT_RANKING_DATA = pnlAndTvRanking.reduce((acc, current) => {
        acc[current.address] = current;
        return acc;
    }, {});

    await cache.set(END_TIMESTAMP_KEY, (maxCloseTimestamp + 1).toString());
    await cache.set(WEEKLY_PNL_CACHE_KEY, TOP_25_PNL_TRADERS);
    await cache.set(WEEKLY_TV_CACHE_KEY, TOP_25_TV_TRADERS);
    await cache.set(WEEKLY_RANKING_CACHE_KEY, TRADING_EVENT_RANKING_DATA);

    return { pnlRanking, tvRanking };
}

function combineLists(pnlRanking: any[], tvRanking: any[]): any[] {
    return pnlRanking.map((item1) => {
        const item2 = tvRanking.find((item) => item.address == item1.address);
        return { ...item1, tvRanking: item2.tvRanking };
    });
}

export async function getWeeklyEventInfo(target: string = 'None') {
    if (!target || target == 'None') {
        target = getWeeklyEventTarget();
    }
    return {
        target,
        startTimestamp: START_TIMESTAMP[target],
        endTimestamp: END_TIMESTAMP[target]
    }
}

export async function getRankingOfTradingVolume(target: string = 'None') {
    if (target == 'MAIN') {
        return await cache.get(TV_CACHE_KEY) ?? [];
    }
    if (target != 'None') {
        return await cache.get(TV_CACHE_KEY + "_" + target) ?? [];
    }

    if (!TOP_25_TV_TRADERS || TOP_25_TV_TRADERS.length === 0) {
        TOP_25_TV_TRADERS = await cache.get(WEEKLY_TV_CACHE_KEY) ?? [];
        if (!TOP_25_TV_TRADERS || TOP_25_TV_TRADERS.length === 0) {
            await setWeeklyTradingEvent();
        }
    }

    return TOP_25_TV_TRADERS;
}

export async function getRankingOfPnl(target: string = 'None') {
    if (target == 'MAIN') {
        return await cache.get(PNL_CACHE_KEY) ?? [];
    }
    if (target != 'None') {
        return await cache.get(PNL_CACHE_KEY + "_" + target) ?? [];
    }

    if (!TOP_25_PNL_TRADERS || TOP_25_PNL_TRADERS.length === 0) {
        TOP_25_PNL_TRADERS = await cache.get(WEEKLY_PNL_CACHE_KEY) ?? [];
        if (!TOP_25_PNL_TRADERS || TOP_25_PNL_TRADERS.length === 0) {
            await setWeeklyTradingEvent();
        }
    }

    return TOP_25_PNL_TRADERS;
}

export async function getRankingOfTrader(address: string, target: string = 'None') {
    if (target == 'MAIN') {
        const rankingData = await cache.get(RANKING_CACHE_KEY) ?? [];
        return rankingData.hasOwnProperty(address) ? rankingData[address] : {};
    }
    if (target != 'None') {
        const rankingData = await cache.get(PNL_CACHE_KEY + "_" + target) ?? [];
        return rankingData.hasOwnProperty(address) ? rankingData[address] : {};
    }

    if (!TRADING_EVENT_RANKING_DATA || Object.keys(TRADING_EVENT_RANKING_DATA).length === 0) {
        TRADING_EVENT_RANKING_DATA = await cache.get(WEEKLY_RANKING_CACHE_KEY);
        if (!TRADING_EVENT_RANKING_DATA || Object.keys(TRADING_EVENT_RANKING_DATA).length === 0) {
            return {};
        }
    }

    return TRADING_EVENT_RANKING_DATA.hasOwnProperty(address) ? TRADING_EVENT_RANKING_DATA[address] : {};
}

async function getTradersWithCloseTrades(chain: string = ALL_NETWORK_STR, startTimestamp: string, endTimestamp: string) {
    if (chain === ARBITRUM_NETWORK_STR) {
        const data = await arbitrumGraphQL.getCloseTradesOfUsersAll(startTimestamp, endTimestamp);
        const { traders } = data;
        return traders;
    } else if (chain === ZKSYNCERA_NETWORK_STR) {
        const data = await zksyncEraGraphQL.getCloseTradesOfUsersAll(startTimestamp, endTimestamp);
        const { traders } = data;
        return traders;
    } else {
        const promises = targetGraphQL.map((graphQL) => {
            return graphQL.getCloseTradesOfUsersAll(startTimestamp, endTimestamp);
        })

        const results = await Promise.all(promises);

        const traders = mergeTraders(...results);
        return traders;
    }
}

async function getCloseTrades(chain: string = ALL_NETWORK_STR, startTimestamp: string = '0', endTimestamp: string = (Math.round(Date.now() / 1000)).toString()) {
    logger.info(`[getCloseTrades] ${chain}, ${startTimestamp}, ${endTimestamp}`);
    if (chain === ARBITRUM_NETWORK_STR) {
        const data = await arbitrumGraphQL.getCloseTradesWhereTimestampAll(startTimestamp, endTimestamp);
        const { closeTrades } = data;
        return closeTrades;
    } else if (chain === ZKSYNCERA_NETWORK_STR) {
        const data = await zksyncEraGraphQL.getCloseTradesWhereTimestampAll(startTimestamp, endTimestamp);
        const { closeTrades } = data;
        return closeTrades;
    } else {
        const promises = targetGraphQL.map((graphQL) => {
            return graphQL.getCloseTradesWhereTimestampAll(startTimestamp, endTimestamp)
        })
        const results = await Promise.all(promises);
        const closeTrades: any = mergeCloseTrades(...results);
        return closeTrades;
    }
}

function mergeTraders(...datas: any[]): any {
    const mergedTraders: any = [];
    const traderMap = new Map<string, any>();

    for (const data of datas) {
        if (!data || !data.traders) {
            continue;
        }
        for (const trader of data.traders) {
            const traderId = trader.id;
            if (!traderMap.has(traderId)) {
                traderMap.set(traderId, trader);
            } else {
                traderMap.get(traderId).closeTrades.push(...trader.closeTrades);
            }
        }
    }

    for (const trader of traderMap.values()) {
        mergedTraders.push(trader);
    }

    return mergedTraders;
}

function mergeCloseTrades(...datas: any[]): any {
    const mergedCloseTrades: any[] = [];

    const closeTradeMap = new Map<string, any>();

    for (const data of datas) {
        if (!data || !data.closeTrades) {
            continue;
        }
        for (const closeTrade of data.closeTrades) {
            const tradeId = closeTrade.id;
            if (!closeTradeMap.has(tradeId)) {
                closeTradeMap.set(tradeId, closeTrade);
            }
        }
    }

    for (const closeTrade of closeTradeMap.values()) {
        mergedCloseTrades.push(closeTrade);
    }

    return mergedCloseTrades;
}

function pad0ToNum(num: number): string {
    if (num > 0 && num < 10) {
        return `0${num}`;
    }

    return String(num);
}
