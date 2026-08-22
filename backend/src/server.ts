import app from "./app";
import { env } from "./config/env";
import { scheduleMonthlyReportJob } from "./jobs/monthlyReport.job";
import { scheduleRecurringPaymentsJob } from "./jobs/recurringPayment.job";
import { scheduleTokenCleanupJob } from "./jobs/tokenCleanup.job";
import { scheduleDemoResetJob } from "./jobs/demoReset.job";
import { scheduleBudgetAlertsJob } from "./jobs/budgetAlert.job";

app.listen(env.port, async () => {
  console.log(`Server running on port ${env.port}`);
  scheduleMonthlyReportJob();
  scheduleRecurringPaymentsJob();
  scheduleTokenCleanupJob();
  // Wait for the demo account's first reset to finish before checking
  // budget thresholds, so the demo's over-budget categories get their
  // alert generated on this same boot instead of missing it and having
  // to wait up to 6 hours for the next scheduled check.
  await scheduleDemoResetJob();
  scheduleBudgetAlertsJob();
});