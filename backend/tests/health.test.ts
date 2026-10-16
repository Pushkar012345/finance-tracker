import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("health endpoints", () => {
  it("GET /health reports the process is alive", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptimeSeconds).toBe("number");
  });

  it("GET /health/ready confirms the database is reachable", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "up" });
  });
});