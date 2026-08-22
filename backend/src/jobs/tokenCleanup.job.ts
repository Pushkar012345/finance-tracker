import cron from "node-cron";
import { prisma } from "../lib/prisma";

// Every login/refresh writes a new row and rotation revokes the old one,
// so this table grows forever without cleanup. Stale rows carry no
// security value (expired tokens can't be used; revoked ones already
// can't either) — this just keeps the table small and queries fast.
export function scheduleTokenCleanupJob() {
  cron.schedule("30 3 * * *", () => {
    const now = new Date();
    prisma.refreshToken
      .deleteMany({
        where: {
          OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
        },
      })
      .then((result: { count: number }) => {
        console.log(`[tokenCleanupJob] Purged ${result.count} stale refresh token(s).`);
      })
      .catch((err: unknown) => {
        console.error("[tokenCleanupJob] Unexpected error:", err);
      });
  });
  console.log("[tokenCleanupJob] Scheduled: 03:30 UTC daily.");
}