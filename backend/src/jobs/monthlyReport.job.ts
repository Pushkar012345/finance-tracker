import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { generateMonthlyReport } from "../services/ai.service";

/**
 * Generates the AI monthly report for the month that just ended, for every
 * user who has at least one transaction in that month (generateMonthlyReport
 * throws on zero transactions, so those users are skipped rather than
 * failing the whole run). Safe to call multiple times — generateMonthlyReport
 * upserts into AIReport.
 */
export async function runMonthlyReportJob(now: Date = new Date()) {
  // Previous calendar month, since this runs at the start of the new month.
  const prevMonthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
  const month = prevMonthDate.getUTCMonth() + 1;
  const year = prevMonthDate.getUTCFullYear();

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 1));

  const userIds = await prisma.transaction.findMany({
    where: { date: { gte: periodStart, lt: periodEnd } },
    distinct: ["userId"],
    select: { userId: true },
  });

  console.log(`[monthlyReportJob] Generating reports for ${month}/${year} — ${userIds.length} user(s) with activity.`);

  let succeeded = 0;
  let failed = 0;
  for (const { userId } of userIds) {
    try {
      await generateMonthlyReport(userId, month, year);
      succeeded++;
    } catch (err) {
      failed++;
      console.error(`[monthlyReportJob] Failed for user ${userId}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[monthlyReportJob] Done. ${succeeded} succeeded, ${failed} failed.`);
  return { month, year, succeeded, failed };
}

/**
 * Schedules the job for 03:00 UTC on the 1st of every month. Registered
 * once at server startup; no-op if AI isn't configured (individual report
 * generations will just fail fast and get logged, the app keeps running).
 */
export function scheduleMonthlyReportJob() {
  cron.schedule("0 3 1 * *", () => {
    runMonthlyReportJob().catch((err) => {
      console.error("[monthlyReportJob] Unexpected top-level error:", err);
    });
  });
  console.log("[monthlyReportJob] Scheduled: 03:00 UTC on the 1st of every month.");
}