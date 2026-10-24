import type { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/api-error.js";
import type { Role } from "../generated/prisma/client";

const ROLE_HIERARCHY: Record<Role, number> = {
  STUDENT: 1,
  MENTOR: 2,
  ADMIN: 3,
};

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(
      ApiError.unauthorized("Missing or malformed Authorization header"),
    );
  }
  const token = header.slice(7).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
};

export const requireRole =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());

    if (req.user.role === "ADMIN") return next();

    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }

    next();
  };
