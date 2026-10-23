import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  submissionLimiter,
  reviewLimiter,
} from "../../middleware/rateLimit.js";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  reviewProjectSchema,
  projectIdParamSchema,
} from "./project.schema.js";
import * as ctrl from "./project.controller.js";

export const projectRouter = Router();

// ══════════════════════════════════════════════════════════
// Student routes
// ══════════════════════════════════════════════════════════

projectRouter.post(
  "/",
  authenticate,
  requireRole("STUDENT"),
  submissionLimiter,
  validate({ body: createProjectSchema }),
  ctrl.create,
);

// ⚠️ /me must come BEFORE any /:id GET route (future-proof)
projectRouter.get("/me", authenticate, requireRole("STUDENT"), ctrl.mine);

// ══════════════════════════════════════════════════════════
// Mentor / Admin routes
// ══════════════════════════════════════════════════════════

projectRouter.get("/stats", authenticate, requireRole("MENTOR"), ctrl.getStats);

projectRouter.get(
  "/",
  authenticate,
  requireRole("MENTOR"),
  validate({ query: listProjectsQuerySchema }),
  ctrl.list,
);

projectRouter.patch(
  "/:id/review",
  authenticate,
  requireRole("MENTOR"),
  reviewLimiter,
  validate({ params: projectIdParamSchema, body: reviewProjectSchema }),
  ctrl.review,
);
