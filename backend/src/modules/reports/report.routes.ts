import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as reportController from "./report.controller";

export const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get("/dashboard", reportController.getDashboardSummary);
reportRouter.get("/sales", reportController.getSalesReport);
reportRouter.get("/invoices", reportController.getInvoiceReport);
reportRouter.get("/tax", reportController.getTaxReport);
