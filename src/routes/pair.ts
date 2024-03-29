import { Request, Response, Router } from "express";
import {
  getMidnightPairPrice,
  setMidnightPairPrice,
} from "../services/pythService";

/**
 * @swagger
 * tags:
 *   name: Pair
 *   description: Pair API
 */
const pairRouter = Router();

/**
 * @swagger
 * /pair/price/midnight:
 *   get:
 *    summary: get midnight(UTC0) price of pairs
 *    tags: [Pair]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
pairRouter.get("/price/midnight", async (req: Request, res: Response) => {
  const ret = await getMidnightPairPrice();

  return res.status(200).send(ret);
});

/**
 * @swagger
 * /pair/price/midnight:
 *   post:
 *    summary: set midnight(UTC0) price of pairs
 *    tags: [Pair]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *             schema:
 *              type: object
 */
pairRouter.post("/price/midnight", async (req: Request, res: Response) => {
  const ret = await setMidnightPairPrice();

  return res.status(200).send(ret);
});

export { pairRouter };
