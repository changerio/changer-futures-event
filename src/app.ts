import express from "express";
import cors from "cors";
import path from "path";

import { logger } from "./utils/logger"
import { loadSwagger } from "./swagger";
import { eventRouter } from "./routes/event";
import { loadWorker } from "./worker/updateMainnetOpenEventRanking";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT ?? 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public"), { maxAge: 31557600000 }));
app.use(cors())

loadSwagger(app);
loadWorker();

// router
app.use("/event", eventRouter);

export default app;
