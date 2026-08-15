import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
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

// Required behind a reverse proxy (Render, Railway, Vercel, etc.) so
// express-rate-limit and req.ip see the real client IP from X-Forwarded-For
// instead of the proxy's IP. Without this, rate limits apply to all users
// combined rather than per-client. Harmless locally / with no proxy.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json());
app.use(globalRateLimiter);
app.use("/api/budgets", budgetRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
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