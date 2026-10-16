import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import budgetRoutes from "./routes/budget.routes";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import transactionRoutes from "./routes/transaction.routes";
import goalRoutes from "./routes/goal.routes";
import aiRoutes from "./routes/ai.routes";
import recurringPaymentRoutes from "./routes/recurringPayment.routes";
import notificationRoutes from "./routes/notification.routes";
const app = express();

app.use(helmet());

// Health endpoints are registered BEFORE CORS and the rate limiter on
// purpose: Docker, load balancers and uptime monitors poll these every few
// seconds, and they must never be throttled (a 429 would look like an
// outage) or blocked by CORS.
//
// /health       -> liveness: "is the process up?" Never touches the DB, so a
//                  database blip doesn't make the orchestrator kill a
//                  perfectly healthy container.
// /health/ready -> readiness: "can it actually serve traffic?" Round-trips
//                  to Postgres and returns 503 if that fails.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
});

app.get("/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "up" });
  } catch (err) {
    console.error("[health] readiness check failed:", err);
    res.status(503).json({ status: "unavailable", database: "down" });
  }
});

app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json());
app.use(globalRateLimiter);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/recurring-payments", recurringPaymentRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;