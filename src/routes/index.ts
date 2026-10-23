import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { projectRouter } from "../modules/projects/project.routes";

const router = Router();
router.use("/auth", AuthRoutes);
router.use("/projects", projectRouter);
export const IndexRoutes = router;
