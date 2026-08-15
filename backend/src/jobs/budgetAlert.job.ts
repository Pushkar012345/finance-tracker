import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { createBudgetAlertNotification } from "../services/notification.service";

const WARNING_THRESHOLD = 80;
const EXCEEDED_THRESHOLD = 100;

/**
 * Checks every budget for the current month/year against actual spend and
 * fires a BUDGET_WARNING notification at 80% and a BUDGET_EXCEEDED
 * notification at 100%. Safe to call repeatedly — since a Budget row is
 * already scoped to one userId+categoryId+month+year (see the @@unique on
 * Budget), a notification is only created once per budget per type, so
 * re-running this job doesn't spam duplicate alerts.
 */
export async function runBudgetAlertsJob(now: Date = new Date()) {
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 1));

  const budgets = await prisma.budget.findMany({
    where: { month, year },
    include: {
      category: true,
      user: { select: { id: true, email: true, name: true, baseCurrency: true } },
    },
  });

  let warningsSent = 0;
  let exceededSent = 0;

  for (const budget of budgets) {
    const limit = Number(budget.amount);
    if (limit <= 0) continue;

    const spendResult = await prisma.transaction.aggregate({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        type: "EXPENSE",
        date: { gte: periodStart, lt: periodEnd },
      },
      _sum: { amount: true },
    });
    const spent = Number(spendResult._sum.amount ?? 0);
    const percentUsed = Math.round((spent / limit) * 100);

    const desiredType =
      percentUsed >= EXCEEDED_THRESHOLD
        ? "BUDGET_EXCEEDED"
        : percentUsed >= WARNING_THRESHOLD
          ? "BUDGET_WARNING"
          : null;
    if (!desiredType) continue;

    const alreadyNotified = await prisma.notification.findFirst({
      where: { budgetId: budget.id, type: desiredType },
    });
    if (alreadyNotified) continue;

    await createBudgetAlertNotification({
      userId: budget.userId,
      userEmail: budget.user.email,
      userName: budget.user.name,
      budgetId: budget.id,
      categoryName: budget.category.name,
      baseCurrency: budget.user.baseCurrency,
      limit,
      spent,
      percentUsed,
      type: desiredType,
    });

    if (desiredType === "BUDGET_EXCEEDED") exceededSent++;
    else warningsSent++;
  }

  console.log(
    `[budgetAlertsJob] Done. ${warningsSent} warning(s), ${exceededSent} exceeded alert(s) sent.`
  );
  return { warningsSent, exceededSent };
}

/** Runs every 6 hours — frequent enough to catch threshold crossings same-day without hammering the DB. */
export function scheduleBudgetAlertsJob() {
  cron.schedule("0 */6 * * *", () => {
    runBudgetAlertsJob().catch((err) => {
      console.error("[budgetAlertsJob] Unexpected top-level error:", err);
    });
  });
  console.log("[budgetAlertsJob] Scheduled: every 6 hours.");
}