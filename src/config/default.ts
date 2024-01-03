import { CHAIN_IDS, PYTH, SUBGRAPHS } from "./constants";
import dotenv from "dotenv";

// Load base .env file first
dotenv.config({ debug: true });

const NETWORK_NAME = process.env.NETWORK_NAME ?? "hardhat";
const ALCHEMY_QUERY_KEY = process.env.ALCHEMY_QUERY_KEY ?? "";

function isMainnet() {
	return NETWORK_NAME == "zksyncEra" || NETWORK_NAME == "arbitrum"
}

const config = {
	isMainnet: isMainnet(),
	NETWORK_NAME: NETWORK_NAME,
	CHAIN_ID: CHAIN_IDS[NETWORK_NAME as keyof typeof CHAIN_IDS],
	url: {
		base: process.env.BASE_URL ?? "http://localhost:3000",
		api: process.env.API_URL ?? "/api",
		swagger: process.env.SWAGGER_URL ?? "/api-docs"
	},
	env: {
		name: process.env.NODE_ENV ?? "development",
		port: process.env.PORT ?? 3000,
	},
	subgraph: {
		gambit: process.env.SUBGRAPH_URL ?? SUBGRAPHS[NETWORK_NAME as keyof typeof CHAIN_IDS],
		arbitrum: isMainnet() ? SUBGRAPHS.arbitrum.replace("{QUERY_KEY}", ALCHEMY_QUERY_KEY) : SUBGRAPHS.arbitrumGoerli,
		zksync: isMainnet() ? SUBGRAPHS.zksyncEra : SUBGRAPHS.zksyncEraGoerli,
	},
	DUNE_API_KEY: process.env.DUNE_API_KEY ?? "",
	PYTH_API: isMainnet() ? PYTH.mainnet : PYTH.testnet,
};

console.log('## config :', config);
export default config;
