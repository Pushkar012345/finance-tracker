import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";
import { createTestUser } from "./helpers";

describe("POST /api/auth/signup", () => {
  it("creates a user and returns a token pair", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Ada Lovelace", email: "ada@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com" });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(typeof res.body.accessToken).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
  });

  it("seeds default categories on signup", async () => {
    const { authHeader } = await createTestUser();
    const res = await request(app).get("/api/categories").set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.some((c: { type: string }) => c.type === "EXPENSE")).toBe(true);
    expect(res.body.some((c: { type: string }) => c.type === "INCOME")).toBe(true);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ name: "Ada", email: "dupe@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Someone Else", email: "dupe@example.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("rejects a weak/short password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Ada", email: "weak@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty("password");
  });

  it("rejects an invalid email with 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Ada", email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ name: "Grace Hopper", email: "grace@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
  });

  it("rejects wrong password with 401 and no user-existence hint", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ name: "Grace", email: "grace2@example.com", password: "password123" });

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace2@example.com", password: "wrongpassword" });

    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "wrongpassword" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    // Same message for "wrong password" and "no such account" so a caller
    // can't use the response to enumerate which emails are registered.
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });
});

describe("POST /api/auth/refresh", () => {
  it("issues a new token pair from a valid refresh token", async () => {
    const { refreshToken } = await createTestUser();

    const res = await request(app).post("/api/auth/refresh").send({ refreshToken });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it("rotates the token: the old refresh token cannot be reused", async () => {
    const { refreshToken } = await createTestUser();

    const first = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(first.status).toBe(200);

    const reused = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(reused.status).toBe(401);
  });

  it("rejects a garbage refresh token with 401", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "not-a-real-token" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("revokes the refresh token so it can no longer be used", async () => {
    const { refreshToken } = await createTestUser();

    const logoutRes = await request(app).post("/api/auth/logout").send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 with no auth header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a malformed/garbage token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });

  it("returns the caller's identity with a valid access token", async () => {
    const { authHeader, user } = await createTestUser();
    const res = await request(app).get("/api/auth/me").set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
  });
});