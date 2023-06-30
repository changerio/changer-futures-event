import { Request, Response, Router } from "express";

import { getCloseTradesOfTraderForTestnet10th, getCloseTradesOfTraderForTestnet9th, getRankingOfPnl, getRankingOfPnlRealTime, getRankingOfTrader, getRankingOfTradingVolume, getRankingOfTradingVolumeRealTime, getTestnetEvent910, getTestnetEventByAddress, getTestnetEventResult, getTradersForTestnet10th, getTradersForTestnet9th, setMainnetOpenEvent } from "../services/eventService";

/**
 * @swagger
 * tags: 
 *   name: Event
 *   description: 이벤트 조회용 API
 */
const eventRouter = Router();

/**
 * @swagger
 * /event/mainnet-open/tv/realtime/:
 *   get:
 *    summary: 메인넷 win rate competition (trading volume) 실시간 조회
 *    tags: [Event]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
eventRouter.get("/mainnet-open/tv/realtime", async (req: Request, res: Response) => {
    const ret = await getRankingOfTradingVolumeRealTime();

    return res.status(200).send(ret);
});

/**
 * @swagger
 * /event/mainnet-open/pnl/realtime/:
 *   get:
 *    summary: 메인넷 win rate competition (PNL) 실시간 조회
 *    tags: [Event]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
eventRouter.get("/mainnet-open/pnl/realtime", async (req: Request, res: Response) => {
    const ret = await getRankingOfPnlRealTime();

    return res.status(200).send(ret);
});


/**
 * @swagger
 * /event/mainnet-open/tv/:
 *   get:
 *    summary: 메인넷 win rate competition (trading volume)
 *    tags: [Event]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
eventRouter.get("/mainnet-open/tv", async (req: Request, res: Response) => {
    const ret = await getRankingOfTradingVolume();

    return res.status(200).send(ret);
});

/**
 * @swagger
 * /event/mainnet-open/pnl/:
 *   get:
 *    summary: 메인넷 win rate competition (PNL)
 *    tags: [Event]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
eventRouter.get("/mainnet-open/pnl", async (req: Request, res: Response) => {
    const ret = await getRankingOfPnl();

    return res.status(200).send(ret);
});

/**
 * @swagger
 * /event/mainnet-open/user/:
 *   get:
 *    summary: 메인넷 오픈 이벤트 사용자 정보 조회
 *    tags: [Event]
 *    parameters:
 *      - name: address
 *        in: query
 *        requires: true
 *        description: 주소
 *        example: '0x80ead4C1eb54152eCaD24eA62E75F993d6E55744'
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
eventRouter.get("/mainnet-open/user", async (req: Request, res: Response) => {
    const address: string = req.query.address as string;
    const ret = await getRankingOfTrader(address.toLowerCase());
    return res.status(200).send(ret);
});

/**
 * @swagger
 * /event/mainnet-open/:
 *   post:
 *    summary: 메인넷 오픈 이벤트 수동 업데이트 (reset)
 *    tags: [Event]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
eventRouter.post("/mainnet-open/", async (req: Request, res: Response) => {
    const ret = await setMainnetOpenEvent();
    return res.status(200).send(ret);
});

export { eventRouter };