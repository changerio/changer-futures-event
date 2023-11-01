import { Request, Response, Router } from "express";

import {
  getRankingOfPnl,
  getRankingOfPnlRealTime,
  getRankingOfTrader,
  getRankingOfTradingVolume,
  getRankingOfTradingVolumeRealTime,
  setMainnetOpenEvent,
  upsertMainnetOpenEvent,
  getDailyCloseTrade
} from "../services/eventService";
import { getVaultEventUserData, getVaultEventUserList } from "../services/vaultEventService";

/**
 * @swagger
 * tags:
 *   name: Event
 *   description: 이벤트 조회용 API
 */
const eventRouter = Router();

function onlyFromLocal(req: Request) {
  const clientIp =
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
  var host = req.get("host");
  return (
    clientIp === "127.0.0.1" ||
    clientIp === "::ffff:127.0.0.1" ||
    clientIp === "::1" ||
    host?.indexOf("localhost") !== -1
  );
}

/**
 * @swagger
 * /event/vault-open/:
 *   get:
 *    summary: 메인넷 오픈 이벤트 vault 예치
 *    tags: [Event]
 *    parameters:
 *      - name: startDateStr
 *        in: query
 *        requires: true
 *        description: 집계 시작일
 *        example: '2023-08-01'
 *        schema:
 *          type: string
 *      - name: endDateStr
 *        in: query
 *        requires: true
 *        description: 집계 종료일
 *        example: '2023-10-26'
 *        schema:
 *          type: string
  *      - name: isCsv
 *        in: query
 *        requires: true
 *        description: CSV(plain text) or Object
 *        example: 'true'
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
eventRouter.get("/vault-open/", async (req: Request, res: Response) => {
    const isCsv: boolean = (req.query.isCsv as string).toLowerCase() === "true" ? true : false;
    const startDateStr: string = req.query.startDateStr as string;
    const endDateStr: string = req.query.endDateStr as string;
    const ret = await getVaultEventUserList(startDateStr, endDateStr, isCsv);

    return res.status(200).send(ret);
});

/**
 * @swagger
 * /event/vault-open/user/:
 *   get:
 *    summary: 메인넷 오픈 이벤트 vault 예치 사용자 조회
 *    tags: [Event]
 *    parameters:
 *      - name: address
 *        in: query
 *        requires: true
 *        description: 사용자 주소
 *        example: '0x90bdb45aabbe0e96c607fc6ba6dacb0944cf4313'
 *        schema:
 *          type: string
 *      - name: startDateStr
 *        in: query
 *        requires: true
 *        description: 집계 시작일
 *        example: '2023-08-01'
 *        schema:
 *          type: string
 *      - name: endDateStr
 *        in: query
 *        requires: true
 *        description: 집계 종료일
 *        example: '2023-10-26'
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
eventRouter.get("/vault-open/user/", async (req: Request, res: Response) => {
  const address: string = req.query.address as string;
  const startDateStr: string = req.query.startDateStr as string;
  const endDateStr: string = req.query.endDateStr as string;
  const ret = await getVaultEventUserData(address.toLowerCase(), startDateStr, endDateStr);
  return res.status(200).send(ret);
});


/**
 * @swagger
 * /event/mainnet-open/tv/realtime/:
 *   get:
 *    summary: 메인넷 win rate competition (trading volume) 실시간 조회 - 데이터 업데이트 안됨
 *    tags: [Event]
 *    parameters:
 *      - name: chain
 *        in: query
 *        requires: false
 *        description: zksyncEra | arbitrum | all
 *        example: 'zksyncEra'
 *        schema:
 *          type: string
 *      - name: startTimestamp
 *        in: query
 *        requires: false
 *        description: close trade 시작
 *        example: '1696121278'
 *        schema:
 *          type: string
 *      - name: endTimestamp
 *        in: query
 *        requires: false
 *        description: close trade 종료
 *        example: '1698626878'
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
eventRouter.get("/mainnet-open/tv/realtime", async (req: Request, res: Response) => {
  const chain: string = (req.query.chain as string).toLowerCase() ?? 'all';
  const startTimestamp: number = parseInt(req.query.startTimestamp as string) ?? -1;
  const endTimestamp: number = parseInt(req.query.endTimestamp as string);
  const ret = await getRankingOfTradingVolumeRealTime(chain, startTimestamp, endTimestamp);

  return res.status(200).send(ret);
);

/**
 * @swagger
 * /event/mainnet-open/pnl/realtime/:
 *   get:
 *    summary: 메인넷 win rate competition (PNL) 실시간 조회 - 데이터 업데이트 안됨
 *    tags: [Event]
 *    parameters:
 *      - name: chain
 *        in: query
 *        requires: false
 *        description: zksyncEra | arbitrum | all
 *        example: 'zksyncEra'
 *        schema:
 *          type: string
 *      - name: startTimestamp
 *        in: query
 *        requires: false
 *        description: close trade 시작
 *        example: '1696121278'
 *        schema:
 *          type: string
 *      - name: endTimestamp
 *        in: query
 *        requires: false
 *        description: close trade 종료
 *        example: '1698626878'
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
eventRouter.get("/mainnet-open/pnl/realtime", async (req: Request, res: Response) => {
  const chain: string = (req.query.chain as string).toLowerCase() ?? 'all';
  const startTimestamp: number = parseInt(req.query.startTimestamp as string) ?? -1;
  const endTimestamp: number = parseInt(req.query.endTimestamp as string);
  const ret = await getRankingOfPnlRealTime(chain, startTimestamp, endTimestamp);

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
 * /event/mainnet-open/stat/:
 *   get:
 *    summary: Mainnet statics per day or trade
 *    tags: [Event]
 *    parameters:
 *      - name: isAggregate
 *        in: query
 *        requires: true
 *        description: aggregate per date
 *        example: 'true'
 *        schema:
 *          type: string
  *      - name: isCsv
 *        in: query
 *        requires: true
 *        description: CSV(plain text) or Object
 *        example: 'true'
 *        schema:
 *          type: string
 *      - name: chain
 *        in: query
 *        requires: false
 *        description: zksyncEra | arbitrum | all
 *        example: 'zksyncEra'
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
eventRouter.get("/mainnet-open/stat", async (req: Request, res: Response) => {
  const isAggregate: boolean = (req.query.isAggregate as string).toLowerCase() === "true" ? true : false;
  const isCsv: boolean = (req.query.isCsv as string).toLowerCase() === "true" ? true : false;
  const chain: string = (req.query.chain as string).toLowerCase() ?? 'all';

  const ret = await getDailyCloseTrade(chain, isAggregate, isCsv);

  return res.status(200).send(ret);
}
);


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
 *    summary: 메인넷 오픈 이벤트 사용자 정보 조회 (cache) - 데이터 없으면 setting
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
  if (onlyFromLocal(req)) {
    const ret = await setMainnetOpenEvent();
    return res.status(200).send(ret);
  } else {
    return res.status(401).send();
  }
});

/**
 * @swagger
 * /event/mainnet-open/:
 *   put:
 *    summary: 메인넷 오픈 이벤트 수동 업데이트 (upsert)
 *    tags: [Event]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
eventRouter.put("/mainnet-open/", async (req: Request, res: Response) => {
  if (onlyFromLocal(req)) {
    const ret = await upsertMainnetOpenEvent();
    return res.status(200).send(ret);
  } else {
    return res.status(401).send();
  }
});

export { eventRouter };
