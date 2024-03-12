import { Request, Response, Router } from "express";
import { ALL_NETWORK_STR } from "../config/constants";
import { getAPR } from "../services/duneService";

/**
 * @swagger
 * tags:
 *   name: Query
 *   description: Query API
 */
const queryRouter = Router();

/**
 * @swagger
 * /query/vault/apr:
 *   get:
 *    summary: get apr of vault
 *    tags: [Query]
 *    parameters:
 *      - name: network
 *        in: query
 *        requires: false
 *        description: zksyncEra | arbitrum | all
 *        example: 'arbitrum'
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
queryRouter.get("/vault/apr", async (req: Request, res: Response) => {
  const network: string =
    (req.query.network as string).toLowerCase() ?? ALL_NETWORK_STR;

  const ret = await getAPR(network);

  return res.status(200).send(ret);
});

export { queryRouter };
