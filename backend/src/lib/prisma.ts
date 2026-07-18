import { PrismaClient } from "@prisma/client";

// A single shared instance avoids exhausting Postgres connections
// during development hot-reloads (tsx watch restarts the process often).
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}