import request from "supertest";
import app from "../src/app";

let counter = 0;

/**
 * Signs up a fresh user (unique email per call) and returns their tokens
 * plus a ready-to-use Authorization header value. Every test that needs
 * an authenticated user should call this rather than sharing one across
 * tests, so tests stay independent of each other.
 */
export async function createTestUser(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  counter += 1;
  const email = overrides.email ?? `test-user-${counter}-${Date.now()}@example.com`;
  const password = overrides.password ?? "password123";
  const name = overrides.name ?? "Test User";

  const res = await request(app).post("/api/auth/signup").send({ name, email, password });

  if (res.status !== 201) {
    throw new Error(`Failed to create test user: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    user: res.body.user,
    accessToken: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
    authHeader: `Bearer ${res.body.accessToken}`,
  };
}

/** Fetches the default seeded categories for a user, split by type for convenience. */
export async function getSeededCategories(authHeader: string) {
  const res = await request(app).get("/api/categories").set("Authorization", authHeader);
  const categories: Array<{ id: string; name: string; type: "INCOME" | "EXPENSE" }> = res.body;
  return {
    all: categories,
    expense: categories.find((c) => c.type === "EXPENSE")!,
    income: categories.find((c) => c.type === "INCOME")!,
  };
}