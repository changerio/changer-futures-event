import { Request, Response, Router } from "express";
import { ALL_NETWORK_STR } from "../config/constants";
import {
  getDailyCloseTrade
} from "../services/eventService";

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
  const isAggregate: boolean = (req.query.isAggregate as string).toLowerCase() === "true" ? true : false;
  const isCsv: boolean = (req.query.isCsv as string).toLowerCase() === "true" ? true : false;
  const chain: string = (req.query.chain as string).toLowerCase() ?? ALL_NETWORK_STR;

  const ret = await getDailyCloseTrade(chain, isAggregate, isCsv);

  return res.status(200).send(ret);
});

export { statRouter };
