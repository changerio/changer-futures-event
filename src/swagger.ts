import { Application } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import config from "./config/default";

const options = {
	swaggerDefinition: {
		openapi: "3.0.1",
		info: {
			title: "Changer-futures-monkey",
			version: "1.0.0",
			description: "monkey For ChainPartners",
		},
		servers: [
			{
				url: "http://localhost:3000",
			},
			{
				url: "http://localhost:8080",
			},
		],
		contact: {
			name: "Changer dana",
			url: "http://localhost:3000",
			email: "dana@changpartners.net",
		},
	},
	apis: ["./src/routes/*.ts", './src/swagger/*'],
};

const swaggerSpec = swaggerJSDoc(options);

var swaggerUiOptions = {
	explorer: true
};

// http://localhost:3000/api-docs/
export const loadSwagger = (app: Application) => {
	app.use(config.url.swagger, swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
};
