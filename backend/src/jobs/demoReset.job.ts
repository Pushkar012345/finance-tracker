import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../utils/password";
import { DEFAULT_CATEGORIES } from "../constants/defaultCategories";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME } from "../constants/demo";

/**
 * The demo account (see "Continue without login" on the login page) is a
 * single shared account that any visitor can log into. Left alone, one
 * visitor's edits (deleted transactions, changed budgets, etc.) would be
 * visible — and confusing — to the next visitor. This job periodically
 * wipes the demo user's data and rebuilds it from a fixed, realistic
 * snapshot, so the demo always looks the same regardless of what previous
 * visitors did to it.
 *
 * Safe to run repeatedly and safe to run on a brand-new database — it
 * creates the demo user (and its default categories) if missing, rather
 * than assuming it already exists.
 */
export async function runDemoResetJob() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      passwordHash,
      baseCurrency: "INR",
      categories: {
        create: DEFAULT_CATEGORIES.map((c) => ({ name: c.name, type: c.type, icon: c.icon })),
      },
    },
  });

  // If the demo user already existed but somehow has no categories (e.g.
  // it was created before this job existed), make sure the set it needs
  // below is present rather than failing on a missing categoryId lookup.
  const existingCategories = await prisma.category.findMany({ where: { userId: demoUser.id } });
  const existingNames = new Set(existingCategories.map((c) => c.name));
  const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name));
  if (missing.length > 0) {
    await prisma.category.createMany({
      data: missing.map((c) => ({ ...c, userId: demoUser.id })),
    });
  }

  const categories = await prisma.category.findMany({ where: { userId: demoUser.id } });
  const categoryByName = new Map(categories.map((c) => [c.name, c]));
  const cat = (name: string) => {
    const found = categoryByName.get(name);
    if (!found) throw new Error(`[demoResetJob] Expected demo category "${name}" to exist.`);
    return found;
  };

  // Wipe everything under the demo account, FK-children first — same order
  // as tests/setup.ts, since these tables reference each other the same way.
  await prisma.notification.deleteMany({ where: { userId: demoUser.id } });
  await prisma.aIReport.deleteMany({ where: { userId: demoUser.id } });
  await prisma.recurringPayment.deleteMany({ where: { userId: demoUser.id } });
  await prisma.goal.deleteMany({ where: { userId: demoUser.id } });
  await prisma.budget.deleteMany({ where: { userId: demoUser.id } });
  await prisma.transaction.deleteMany({ where: { userId: demoUser.id } });

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const day = (n: number) => new Date(Date.UTC(year, now.getUTCMonth(), n));

  // A realistic, comfortably-within-budget snapshot — deliberately not
  // maxed out or over any limit, so first-time visitors see a "healthy"
  // dashboard rather than one full of red over-budget warnings.
  await prisma.transaction.createMany({
    data: [
      { amount: 65000, type: "INCOME", description: "Salary", date: day(1), categoryId: cat("Salary").id, userId: demoUser.id },
      { amount: 450, type: "EXPENSE", description: "Groceries", date: day(3), categoryId: cat("Food").id, userId: demoUser.id },
      { amount: 1200, type: "EXPENSE", description: "Rent", date: day(1), categoryId: cat("Rent").id, userId: demoUser.id },
      { amount: 300, type: "EXPENSE", description: "Metro pass", date: day(5), categoryId: cat("Transport").id, userId: demoUser.id },
      { amount: 220, type: "EXPENSE", description: "Movie night", date: day(8), categoryId: cat("Entertainment").id, userId: demoUser.id },
      { amount: 180, type: "EXPENSE", description: "Pharmacy", date: day(10), categoryId: cat("Health").id, userId: demoUser.id },
      { amount: 550, type: "EXPENSE", description: "New shoes", date: day(12), categoryId: cat("Shopping").id, userId: demoUser.id },
      { amount: 90, type: "EXPENSE", description: "Coffee", date: day(14), categoryId: cat("Food").id, userId: demoUser.id },
    ],
  });

  await prisma.budget.createMany({
    data: [
      { amount: 1500, month, year, categoryId: cat("Food").id, userId: demoUser.id },
      { amount: 1200, month, year, categoryId: cat("Rent").id, userId: demoUser.id },
      { amount: 500, month, year, categoryId: cat("Transport").id, userId: demoUser.id },
      { amount: 300, month, year, categoryId: cat("Health").id, userId: demoUser.id },
    ],
  });

  console.log(`[demoResetJob] Demo account (${DEMO_EMAIL}) reset to seed data.`);
}

/** Runs once on boot (so a fresh deploy starts clean) and then hourly. */
export function scheduleDemoResetJob() {
  runDemoResetJob().catch((err) => {
    console.error("[demoResetJob] Initial run failed:", err);
  });

  cron.schedule("0 * * * *", () => {
    runDemoResetJob().catch((err) => {
      console.error("[demoResetJob] Unexpected top-level error:", err);
    });
  });
  console.log("[demoResetJob] Scheduled: hourly, plus once on boot.");
}