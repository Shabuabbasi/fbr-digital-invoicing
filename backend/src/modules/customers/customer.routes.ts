import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import * as customerController from "./customer.controller";

export const customerRouter = Router();

customerRouter.use(requireAuth);

// ADMIN and ACCOUNTANT can view/create/edit; only ADMIN can deactivate — see docs/RBAC.md.
customerRouter.get("/", customerController.list);
customerRouter.get("/:id", customerController.getById);
customerRouter.post("/", requireRole("ADMIN", "ACCOUNTANT"), customerController.create);
customerRouter.patch("/:id", requireRole("ADMIN", "ACCOUNTANT"), customerController.update);
customerRouter.delete("/:id", requireRole("ADMIN"), customerController.deactivate);
