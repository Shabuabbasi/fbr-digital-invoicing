import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import * as companyController from "./company.controller";

export const companyRouter = Router();

companyRouter.use(requireAuth);

companyRouter.get("/", companyController.getCompany);
companyRouter.patch("/", requireRole("ADMIN"), companyController.updateCompany);
companyRouter.get("/fbr-settings", companyController.getFbrSettings);
companyRouter.patch("/fbr-settings", requireRole("ADMIN"), companyController.updateFbrSettings);
