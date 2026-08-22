import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";
import { createTestUser, getSeededCategories } from "./helpers";

describe("Budgets", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/budgets");
    expect(res.status).toBe(401);
  });

  it("creates a budget and returns it with its category attached", async () => {
    const { authHeader } = await createTestUser();
    const { expense } = await getSeededCategories(authHeader);

    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", authHeader)
      .send({ amount: 500, categoryId: expense.id, month: 8, year: 2026 });

    expect(res.status).toBe(201);
    expect(Number(res.body.amount)).toBe(500);
    expect(res.body.category.id).toBe(expense.id);
  });

  it("rejects a negative or zero amount", async () => {
    const { authHeader } = await createTestUser();
    const { expense } = await getSeededCategories(authHeader);

    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", authHeader)
      .send({ amount: 0, categoryId: expense.id, month: 8, year: 2026 });

    expect(res.status).toBe(400);
  });

  it("rejects a categoryId belonging to another user", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const { expense: userBCategory } = await getSeededCategories(userB.authHeader);

    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", userA.authHeader)
      .send({ amount: 500, categoryId: userBCategory.id, month: 8, year: 2026 });

    expect(res.status).toBe(400);
  });

  it("rejects a duplicate budget for the same category/month/year", async () => {
    const { authHeader } = await createTestUser();
    const { expense } = await getSeededCategories(authHeader);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", authHeader)
      .send({ amount: 500, categoryId: expense.id, month: 8, year: 2026 });

    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", authHeader)
      .send({ amount: 700, categoryId: expense.id, month: 8, year: 2026 });

    expect(res.status).toBe(409);
  });

  it("lists only the caller's own budgets for the given month/year, with spend progress", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const { expense: catA } = await getSeededCategories(userA.authHeader);
    const { expense: catB } = await getSeededCategories(userB.authHeader);

    await request(app)
      .post("/api/budgets")
      .set("Authorization", userA.authHeader)
      .send({ amount: 200, categoryId: catA.id, month: 8, year: 2026 });

    await request(app)
      .post("/api/budgets")
      .set("Authorization", userB.authHeader)
      .send({ amount: 300, categoryId: catB.id, month: 8, year: 2026 });

    await request(app)
      .post("/api/transactions")
      .set("Authorization", userA.authHeader)
      .send({ amount: 50, type: "EXPENSE", description: "Groceries", date: "2026-08-05", categoryId: catA.id });

    const res = await request(app)
      .get("/api/budgets?month=8&year=2026")
      .set("Authorization", userA.authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].category.id).toBe(catA.id);
    expect(res.body[0].spent).toBe(50);
    expect(res.body[0].remaining).toBe(150);
    expect(res.body[0].percentUsed).toBe(25);
  });

  it("updates and then deletes a budget", async () => {
    const { authHeader } = await createTestUser();
    const { expense } = await getSeededCategories(authHeader);

    const created = await request(app)
      .post("/api/budgets")
      .set("Authorization", authHeader)
      .send({ amount: 500, categoryId: expense.id, month: 8, year: 2026 });

    const updated = await request(app)
      .patch(`/api/budgets/${created.body.id}`)
      .set("Authorization", authHeader)
      .send({ amount: 750 });

    expect(updated.status).toBe(200);
    expect(Number(updated.body.amount)).toBe(750);

    const deleted = await request(app)
      .delete(`/api/budgets/${created.body.id}`)
      .set("Authorization", authHeader);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app)
      .get("/api/budgets?month=8&year=2026")
      .set("Authorization", authHeader);
    expect(afterDelete.body).toHaveLength(0);
  });

  it("returns 404 (not another user's data) when updating someone else's budget", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const { expense: catA } = await getSeededCategories(userA.authHeader);

    const created = await request(app)
      .post("/api/budgets")
      .set("Authorization", userA.authHeader)
      .send({ amount: 500, categoryId: catA.id, month: 8, year: 2026 });

    const res = await request(app)
      .patch(`/api/budgets/${created.body.id}`)
      .set("Authorization", userB.authHeader)
      .send({ amount: 999 });

    expect(res.status).toBe(404);
  });
});