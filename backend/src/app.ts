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