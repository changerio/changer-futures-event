import { getPair, getOpenTradesOfUser } from "../../src/subgraph/gambit";

describe("subgraph test", () => {
    it("getPair", async () => {
        const result = await getPair(0);

        expect(result.pair.id).toBe('0');
        expect(result.pair.name).toBe('BTC/USD');
        expect(result.pair.from).toBe('BTC');
    });

    it("getOpenTradesOfUser", async () => {
        const result = await getOpenTradesOfUser("0x050b246f0e7c08473772b24c8e565b0088bd9eb5");
        console.log(result.trader.openTrades);
    });
});