import { Request, Response, Router } from "express";
import { ALL_NETWORK_STR } from "../config/constants";
import {
  getDailyCloseTrade,
  getRankingOfPnlRealTime,
  getRankingOfTradingVolumeRealTime,
} from "../services/eventService";
import { onlyFromLocal } from "./event";

/**
 * @swagger
 * tags:
 *   name: Stat
 *   description: statics API
 */
const statRouter = Router();

/**
 * @swagger
 * /stat/day-trade/:
 *   get:
 *    summary: Mainnet statics per day or trade
 *    tags: [Stat]
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
statRouter.get("/day-trade", async (req: Request, res: Response) => {
  const isAggregate: boolean =
    (req.query.isAggregate as string).toLowerCase() === "true" ? true : false;
  const isCsv: boolean =
    (req.query.isCsv as string).toLowerCase() === "true" ? true : false;
  const chain: string =
    (req.query.chain as string).toLowerCase() ?? ALL_NETWORK_STR;

  const ret = await getDailyCloseTrade(chain, isAggregate, isCsv);

  return res.status(200).send(ret);
});

/**
 * @swagger
 * /stat/tv/realtime/:
 *   get:
 *    summary: 특정 기간내 trader tv 순위 조회
 *    tags: [Stat]
 *    parameters:
 *      - name: chain
 *        in: query
 *        requires: false
 *        description: zksyncEra | arbitrum | all
 *        example: 'all'
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
 *      - name: isCsv
 *        in: query
 *        requires: false
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
statRouter.get("/tv/realtime", async (req: Request, res: Response) => {
  if(onlyFromLocal(req)) {
    const isCsv: boolean =
      (req.query.isCsv as string).toLowerCase() === "true" ? true : false;
    const chain: string =
      (req.query.chain as string).toLowerCase() ?? ALL_NETWORK_STR;
    const startTimestamp: string = (req.query.startTimestamp as string) ?? "0";
    const endTimestamp: string = req.query.endTimestamp as string;
    const ret = await getRankingOfTradingVolumeRealTime(
      chain,
      startTimestamp,
      endTimestamp,
      isCsv
    );

    return res.status(200).send(ret);
  } else {
    return res.status(401).send();
  }
});

/**
 * @swagger
 * /stat/pnl/realtime/:
 *   get:
 *    summary: 특정 기간내 trader pnl 순위 조회
 *    tags: [Stat]
 *    parameters:
 *      - name: chain
 *        in: query
 *        requires: false
 *        description: zksyncEra | arbitrum | all
 *        example: 'all'
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
 *      - name: isCsv
 *        in: query
 *        requires: false
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
statRouter.get("/pnl/realtime", async (req: Request, res: Response) => {
  if(onlyFromLocal(req)) {
    const isCsv: boolean =
      (req.query.isCsv as string).toLowerCase() === "true" ? true : false;
    const chain: string =
      (req.query.chain as string).toLowerCase() ?? ALL_NETWORK_STR;
    const startTimestamp: string = (req.query.startTimestamp as string) ?? "0";
    const endTimestamp: string = req.query.endTimestamp as string;
    const ret = await getRankingOfPnlRealTime(
      chain,
      startTimestamp,
      endTimestamp,
      isCsv
    );

    return res.status(200).send(ret);
  } else {
    return res.status(401).send();
  }
});

export { statRouter };
