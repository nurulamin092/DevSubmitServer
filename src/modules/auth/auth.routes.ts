import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import * as ctrl from "./auth.controller";

const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), ctrl.register);
authRouter.post("/login", validate({ body: loginSchema }), ctrl.login);
authRouter.get("/me", authenticate, ctrl.me);

export const AuthRoutes: Router = authRouter;
