import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { advanceDate } from "../controllers/recurringPayment.controller";

/**
 * Finds every active recurring payment whose nextRunDate has arrived,
 * creates a matching Transaction, and advances nextRunDate. Payments past
 * their endDate are deactivated instead of run. Safe to call repeatedly —
 * each due occurrence only fires once because nextRunDate moves forward
 * after it runs.
 */
export async function runRecurringPaymentsJob(now: Date = new Date()) {
  const due = await prisma.recurringPayment.findMany({
    where: { active: true, nextRunDate: { lte: now } },
  });

  let created = 0;
  let deactivated = 0;

  for (const payment of due) {
    if (payment.endDate && payment.endDate < now) {
      await prisma.recurringPayment.update({
        where: { id: payment.id },
        data: { active: false },
      });
      deactivated++;
      continue;
    }

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          amount: payment.amount,
          type: payment.type,
          description: payment.description,
          date: payment.nextRunDate,
          userId: payment.userId,
          categoryId: payment.categoryId,
        },
      }),
      prisma.recurringPayment.update({
        where: { id: payment.id },
        data: { nextRunDate: advanceDate(payment.nextRunDate, payment.frequency) },
      }),
    ]);
    created++;
  }

  console.log(`[recurringPaymentsJob] Done. ${created} transaction(s) created, ${deactivated} deactivated.`);
  return { created, deactivated };
}

/** Runs once a day at 01:00 UTC — frequent enough that DAILY recurrences fire on time. */
export function scheduleRecurringPaymentsJob() {
  cron.schedule("0 1 * * *", () => {
    runRecurringPaymentsJob().catch((err) => {
      console.error("[recurringPaymentsJob] Unexpected top-level error:", err);
    });
  });
  console.log("[recurringPaymentsJob] Scheduled: 01:00 UTC daily.");
}