import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { IndexRoutes } from "./routes/index.js";

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY > 0) app.set("trust proxy", env.TRUST_PROXY);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use("/api/v1", IndexRoutes);

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        env: env.NODE_ENV,
        ts: new Date().toISOString(),
      },
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
