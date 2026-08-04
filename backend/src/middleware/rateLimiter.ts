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

// AI endpoints hit a paid, rate-limited upstream (Gemini) and cost real
// money per call, so they get a much tighter cap than general API traffic.
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Wait a few minutes and try again." },
});