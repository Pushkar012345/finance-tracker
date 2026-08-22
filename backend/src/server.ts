import app from "./app";
import { env } from "./config/env";
import { scheduleMonthlyReportJob } from "./jobs/monthlyReport.job";
import { scheduleRecurringPaymentsJob } from "./jobs/recurringPayment.job";
import { scheduleTokenCleanupJob } from "./jobs/tokenCleanup.job";
import { scheduleDemoResetJob } from "./jobs/demoReset.job";

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
  scheduleMonthlyReportJob();
  scheduleRecurringPaymentsJob();
  scheduleTokenCleanupJob();
  scheduleDemoResetJob();
});