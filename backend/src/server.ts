import app from "./app";
import { env } from "./config/env";
import { scheduleMonthlyReportJob } from "./jobs/monthlyReport.job";

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
  scheduleMonthlyReportJob();
});