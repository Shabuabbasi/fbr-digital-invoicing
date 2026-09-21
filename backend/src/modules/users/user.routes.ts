import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import * as userController from "./user.controller";

export const userRouter = Router();

// Users management is ADMIN-only end to end — see docs/RBAC.md "users.manage".
userRouter.use(requireAuth, requireRole("ADMIN"));

userRouter.get("/", userController.list);
userRouter.post("/", userController.create);
userRouter.patch("/:id", userController.update);
userRouter.delete("/:id", userController.deactivate);
