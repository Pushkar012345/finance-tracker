import { runBudgetAlertsJob } from "../jobs/budgetAlert.job";

runBudgetAlertsJob()
  .then((result) => {
    console.log("Done:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });