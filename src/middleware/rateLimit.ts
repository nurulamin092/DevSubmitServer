import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import { isProd } from "../config/env";

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
  max: isProd ? 5 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    req.user?.id ?? ipKeyGenerator(req.ip ?? "0.0.0.0", 56),
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
  max: isProd ? 30 : 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.id ?? ipKeyGenerator(req.ip ?? "0.0.0.0", 56),
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Review rate limit exceeded (max 30 per minute).",
    },
  },
});
