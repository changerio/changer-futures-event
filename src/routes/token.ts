import { Router } from "express";
import { getTokenAllocation } from "../services/tokenService";

/**
 * @swagger
 * tags:
 *  name: Token
 *  description: Token API
 */
export const tokenRouter = Router();

/**
 * @swagger
 * /token/allocation:
 *  get:
 *    summary: Get token allocation information
 *    tags: [Token]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                totalSupply:
 *                  type: number
 *                  description: total supply of CNG
 *                  example: 200000000
 *                locked:
 *                  type: number
 *                  description: locked CNG
 *                  example: 153569418.6439269
 *                staked:
 *                  type: number
 *                  description: staked CNG
 *                  example: 9929560.34
 *                burnt:
 *                  type: number
 *                  description: burnt CNG
 *                  example: 3883110
 *                circulating:
 *                  type: number
 *                  description: circulating CNG
 *                  example: 32617911.016073104
 *
 */
tokenRouter.get("/allocation", async (req, res) => {
  const alloc = await getTokenAllocation();
  return res.status(200).json(alloc);
});

/**
 * @swagger
 * /token/total-supply:
 *  get:
 *    summary: Get total supply of CNG
 *    tags: [Token]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          text/plain:
 *            schema:
 *              type: string
 *              example: 200000000
 */
tokenRouter.get("/total-supply", async (req, res) => {
  const alloc = await getTokenAllocation();
  return res.status(200).send(alloc.totalSupply.toString());
});

/**
 * @swagger
 * /token/circulating:
 *  get:
 *    summary: Get circulating amount of CNG
 *    tags: [Token]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          text/plain:
 *            schema:
 *              type: string
 *              example: 32617911.016073104
 */
tokenRouter.get("/circulating", async (req, res) => {
  const alloc = await getTokenAllocation();
  return res.status(200).send(alloc.circulating.toString());
});
