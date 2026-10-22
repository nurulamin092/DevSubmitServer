import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { isProd } from "../config/env.js";

const skipInDev = () => !isProd;

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 10_000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "Too many requests" },
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 15 : 1_000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req: Request) => req.method === "GET",
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many auth attempts. Try again later.",
    },
  },
});

export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? "unknown",
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Submission rate limit exceeded (5/hour).",
    },
  },
  skip: skipInDev,
});

export const reviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? "unknown",
});
