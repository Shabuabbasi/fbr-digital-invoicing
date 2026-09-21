import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  handler: (_req, res) => {
    res.status(429).json({ success: false, message: "Too many attempts, please try again later", code: "RATE_LIMITED" });
  },
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (_req, res) => {
    res.status(429).json({ success: false, message: "Too many requests, please try again later", code: "RATE_LIMITED" });
  },
});
