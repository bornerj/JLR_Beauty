import cors from "cors";
import express from "express";
import path from "path";
import { MSG } from "./lib/messages";
import prisma from "./lib/prisma";
import routes, { handleStripeWebhook } from "./routes";
import { logger } from "./utils/logger";

const app = express();
app.set("trust proxy", 1);

const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const webAppOrigin = (process.env.APP_WEB_URL || "").trim();
const isProduction = process.env.NODE_ENV === "production";
const developmentFallbackOrigins = [
  webAppOrigin,
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter((origin, index, collection) => Boolean(origin) && collection.indexOf(origin) === index);
const allowedOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : isProduction
    ? webAppOrigin
      ? [webAppOrigin]
      : []
    : developmentFallbackOrigins;

if (isProduction && configuredOrigins.length === 0 && !webAppOrigin) {
  logger.warn(
    "CORS_ORIGIN/APP_WEB_URL nao configurado em producao. Requisicoes cross-origin serao bloqueadas."
  );
}

const isAllowedOrigin = (origin: string): boolean => allowedOrigins.includes(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin blocked by CORS policy"));
    },
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.post(
  "/api/public/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/health/services", async (_req, res) => {
  let postgresStatus = "online";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    postgresStatus = "offline";
  }
  res.json({
    services: {
      nginx:    { status: "online" },
      api:      { status: "online" },
      web:      { status: "online" },
      postgres: { status: postgresStatus },
    },
    time: new Date().toISOString(),
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      db: { connected: true },
      time: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn("Database health check failed", { error });
    const detail = error instanceof Error ? error.message : "database unavailable";
    res.status(503).json({
      status: "error",
      db: { connected: false },
      ...(process.env.NODE_ENV === "development" ? { detail } : {}),
      time: new Date().toISOString(),
    });
  }
});

app.use("/api", routes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof Error && err.message === "Origin blocked by CORS policy") {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  logger.error("Unhandled API error", { err });
  const detail = err instanceof Error ? err.message : "erro inesperado";
  res.status(500).json({
    message: MSG.SERVER_ERROR,
    ...(process.env.NODE_ENV === "development" ? { detail } : {}),
  });
});

export default app;
