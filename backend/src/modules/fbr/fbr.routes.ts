import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import * as fbrController from "./fbr.controller";

export const fbrRouter = Router();

fbrRouter.use(requireAuth);

fbrRouter.get("/submissions", fbrController.listSubmissions);
fbrRouter.get("/submissions/:id", fbrController.getSubmissionById);
// Integration logs are the same submission records, ADMIN-only per docs/RBAC.md "auditLogs.view".
fbrRouter.get("/logs", requireRole("ADMIN"), fbrController.listSubmissions);
