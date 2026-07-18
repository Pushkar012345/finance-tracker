import rateLimit from "express-rate-limit";

// Applies to every request — a generous backstop against runaway
// clients or scripts, not the primary defense.
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again shortly." },
});

// Tighter limit specifically on auth endpoints, to slow down
// credential-stuffing and brute-force login attempts.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Wait a few minutes and try again." },
});