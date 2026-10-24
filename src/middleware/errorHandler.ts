import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";
import { isProd } from "../config/env.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  ) {
    const target =
      (err as { meta?: { target?: string[] } }).meta?.target?.join(", ") ??
      "field";
    return res.status(409).json({
      success: false,
      error: { code: "CONFLICT", message: `Duplicate value for: ${target}` },
    });
  }

  // Zod validation
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error("[UNHANDLED]", err);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL",
      message: "Internal server error",
      ...(isProd
        ? {}
        : { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
};
