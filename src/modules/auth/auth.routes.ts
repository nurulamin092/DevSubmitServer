import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { registerSchema, loginSchema } from "./auth.schema";
import * as ctrl from "./auth.controller";
import { authLimiter } from "../../middleware/rateLimit";

const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  ctrl.register,
);
authRouter.post(
  "/login",
  authLimiter,
  validate({ body: loginSchema }),
  ctrl.login,
);
authRouter.get("/me", authenticate, ctrl.me);

export const AuthRoutes: Router = authRouter;
