import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./app/config";
import router from "./app/routers";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app: Application = express();

app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.use(
  cors({
    origin: config.frontend_urls,
    credentials: true,
  }),
);

// Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.set("trust proxy", 1);

// Router
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Server Is Running..",
    environment: config.node_env,
    uptime: process.uptime().toFixed(2) + " second",
    timeStamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(globalErrorHandler);
// Not Found
app.use(notFound);

export default app;
