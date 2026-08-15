// Loaded by vitest before any test file (and before app.ts, which reads
// env vars at import time) — see vitest.config.ts `setupFiles`.
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { execSync } from "child_process";
import { beforeAll, beforeEach, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy backend/.env.test.example to " +
        "backend/.env.test and point it at a disposable test database " +
        "(never your dev or prod database — this suite wipes all tables " +
        "between tests)."
    );
  }

  // Brings the test database's schema up to date. Safe to run every
  // time: it's a no-op once migrations are already applied.
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
});

// Runs before every single test (not just once) so tests never leak state
// into each other, regardless of execution order. Deleted in FK-safe order:
// children before the parents they reference.
beforeEach(async () => {
  await prisma.notification.deleteMany();
  await prisma.aIReport.deleteMany();
  await prisma.recurringPayment.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});