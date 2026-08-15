import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Tests share one Postgres schema (see tests/setup.ts), so running
    // files in parallel would let them stomp on each other's data.
    fileParallelism: false,
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});