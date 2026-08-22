import cron from "node-cron";
import { processDueRecurringPayments } from "../services/recurringPayment.service";

/**
 * Schedules the recurring-payments sweep for 02:00 UTC every day —
 * before the monthly report job at 03:00, so a month's last recurring
 * transaction is captured in that month's report.
 */
export function scheduleRecurringPaymentsJob() {
  cron.schedule("0 2 * * *", () => {
    processDueRecurringPayments()
      .then(({ processed, transactionsCreated, deactivated }) => {
        console.log(
          `[recurringPaymentsJob] Processed ${processed} due payment(s), created ${transactionsCreated} transaction(s), deactivated ${deactivated}.`
        );
      })
      .catch((err) => {
        console.error("[recurringPaymentsJob] Unexpected top-level error:", err);
      });
  });
  console.log("[recurringPaymentsJob] Scheduled: 02:00 UTC daily.");
}