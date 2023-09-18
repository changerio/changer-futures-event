import { Application } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import config from "./config/default";

const options = {
	swaggerDefinition: {
		openapi: "3.0.1",
		info: {
			title: "Changer-futures-event",
			version: "1.0.0",
			description: "Event statics For Gambit",
		},
		servers: [
			{
				url: "http://localhost:3000",
			},
			{
				url: "https://service.gambit.trade:7443",
			}
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
