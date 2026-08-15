import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";
import { createTestUser, getSeededCategories } from "./helpers";

describe("Transactions", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/transactions");
    expect(res.status).toBe(401);
  });

  it("creates a transaction and returns it with its category attached", async () => {
    const { authHeader } = await createTestUser();
    const { expense } = await getSeededCategories(authHeader);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", authHeader)
      .send({
        amount: 42.5,
        type: "EXPENSE",
        description: "Groceries",
        date: "2026-08-01",
        categoryId: expense.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe("Groceries");
    expect(res.body.category.id).toBe(expense.id);
  });

  it("rejects a negative or zero amount", async () => {
    const { authHeader } = await createTestUser();
    const { expense } = await getSeededCategories(authHeader);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", authHeader)
      .send({ amount: 0, type: "EXPENSE", description: "Free stuff", date: "2026-08-01", categoryId: expense.id });

    expect(res.status).toBe(400);
  });

  it("rejects a categoryId belonging to another user", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const { expense: userBCategory } = await getSeededCategories(userB.authHeader);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", userA.authHeader)
      .send({
        amount: 10,
        type: "EXPENSE",
        description: "Sneaky",
        date: "2026-08-01",
        categoryId: userBCategory.id,
      });

    expect(res.status).toBe(400);
  });

  it("lists only the caller's own transactions", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const { expense: catA } = await getSeededCategories(userA.authHeader);
    const { expense: catB } = await getSeededCategories(userB.authHeader);

    await request(app)
      .post("/api/transactions")
      .set("Authorization", userA.authHeader)
      .send({ amount: 10, type: "EXPENSE", description: "A's coffee", date: "2026-08-01", categoryId: catA.id });

    await request(app)
      .post("/api/transactions")
      .set("Authorization", userB.authHeader)
      .send({ amount: 20, type: "EXPENSE", description: "B's coffee", date: "2026-08-01", categoryId: catB.id });

    const res = await request(app).get("/api/transactions").set("Authorization", userA.authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].description).toBe("A's coffee");
  });

  it("returns 404 (not another user's data) when fetching someone else's transaction by id", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    const { expense: catA } = await getSeededCategories(userA.authHeader);

    const created = await request(app)
      .post("/api/transactions")
      .set("Authorization", userA.authHeader)
      .send({ amount: 10, type: "EXPENSE", description: "Private", date: "2026-08-01", categoryId: catA.id });

    const res = await request(app)
      .get(`/api/transactions/${created.body.id}`)
      .set("Authorization", userB.authHeader);

    expect(res.status).toBe(404);
  });

  it("updates and then deletes a transaction", async () => {
    const { authHeader } = await createTestUser();
    const { expense } = await getSeededCategories(authHeader);

    const created = await request(app)
      .post("/api/transactions")
      .set("Authorization", authHeader)
      .send({ amount: 10, type: "EXPENSE", description: "Original", date: "2026-08-01", categoryId: expense.id });

    const updated = await request(app)
      .patch(`/api/transactions/${created.body.id}`)
      .set("Authorization", authHeader)
      .send({ description: "Updated" });

    expect(updated.status).toBe(200);
    expect(updated.body.description).toBe("Updated");

    const deleted = await request(app)
      .delete(`/api/transactions/${created.body.id}`)
      .set("Authorization", authHeader);
    expect(deleted.status).toBe(204);

    const getAfterDelete = await request(app)
      .get(`/api/transactions/${created.body.id}`)
      .set("Authorization", authHeader);
    expect(getAfterDelete.status).toBe(404);
  });

  it("paginates results per the page/limit query params", async () => {
    const { authHeader } = await createTestUser();
    const { expense } = await getSeededCategories(authHeader);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/transactions")
        .set("Authorization", authHeader)
        .send({ amount: 10, type: "EXPENSE", description: `Item ${i}`, date: "2026-08-01", categoryId: expense.id });
    }

    const res = await request(app)
      .get("/api/transactions?page=1&limit=2")
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 2, total: 5, totalPages: 3 });
  });
});