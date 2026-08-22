import { prisma } from "../lib/prisma";

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/**
 * Returns the next occurrence after `from`, per the given frequency.
 * Operates in UTC so results are stable regardless of server timezone.
 */
export function computeNextRunDate(from: Date, frequency: Frequency): Date {
  const next = new Date(from);

  switch (frequency) {
    case "DAILY":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "WEEKLY":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "MONTHLY":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case "YEARLY":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
  }

  return next;
}

/**
 * Processes every active recurring payment whose nextRunDate has arrived:
 * creates the corresponding transaction, then advances nextRunDate. If the
 * new nextRunDate would fall after endDate, the payment is deactivated
 * rather than deleted, so history and the schedule stay visible.
 *
 * A payment can be several occurrences overdue (e.g. the job didn't run for
 * a few days) — this loop catches it up fully rather than firing once.
 *
 * Safe to call multiple times; each run only ever processes rows whose
 * nextRunDate is due at call time.
 */
export async function processDueRecurringPayments(now: Date = new Date()) {
  const due = await prisma.recurringPayment.findMany({
    where: { isActive: true, nextRunDate: { lte: now } },
  });

  let created = 0;
  let deactivated = 0;

  for (const payment of due) {
    let cursor = payment.nextRunDate;
    let expired = false;

    while (cursor <= now) {
      await prisma.transaction.create({
        data: {
          amount: payment.amount,
          type: payment.type,
          description: payment.description,
          date: cursor,
          userId: payment.userId,
          categoryId: payment.categoryId,
        },
      });
      created++;

      cursor = computeNextRunDate(cursor, payment.frequency as Frequency);

      if (payment.endDate && cursor > payment.endDate) {
        expired = true;
        break;
      }
    }

    await prisma.recurringPayment.update({
      where: { id: payment.id },
      data: { nextRunDate: cursor, ...(expired && { isActive: false }) },
    });
    if (expired) deactivated++;
  }

  return { processed: due.length, transactionsCreated: created, deactivated };
}