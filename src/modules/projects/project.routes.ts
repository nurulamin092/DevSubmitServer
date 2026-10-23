import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { submissionLimiter } from "../../middleware/rateLimit.js";
import { createProjectSchema } from "./project.schema.js";
import * as ctrl from "./project.controller.js";

export const projectRouter = Router();

projectRouter.post(
  "/",
  authenticate,
  requireRole("STUDENT"),
  submissionLimiter,
  validate({ body: createProjectSchema }),
  ctrl.create,
);

projectRouter.get("/me", authenticate, requireRole("STUDENT"), ctrl.mine);
