import type { RequestHandler } from "express";
import { ZodError, type ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError.js";

type Schemas = { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema };

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        // Assign parsed values (coerced numbers, defaults) back to a typed bag
        Object.assign(req.query, schemas.query.parse(req.query));
      }
      if (schemas.params)
        req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          ApiError.badRequest(
            "Validation failed",
            err.issues.map((i) => ({
              path: i.path.join("."),
              message: i.message,
            })),
          ),
        );
      }
      next(err);
    }
  };
