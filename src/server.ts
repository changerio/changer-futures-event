/* eslint-disable no-console */
import app from "./app";
import { logger } from "./utils/logger";

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
  logger.info(
    "  App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  logger.info("  Swagger : http://localhost:%d/api-docs ", app.get("port"));
});

export default server;
