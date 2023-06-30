import { CHAIN_IDS, SUBGRAPHS } from "./constants";
import dotenv from "dotenv";

// Load base .env file first
dotenv.config({ debug: true });

const NETWORK_NAME = process.env.NETWORK_NAME ?? "hardhat";

const config = {
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
		gambit: process.env.SUBGRAPH_URL ?? SUBGRAPHS[NETWORK_NAME as keyof typeof CHAIN_IDS]
	},
};

console.log('## config :', config);
export default config;
