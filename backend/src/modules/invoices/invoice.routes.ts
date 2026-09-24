import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as invoiceController from "./invoice.controller";
import * as fbrController from "../fbr/fbr.controller";

export const invoiceRouter = Router();

invoiceRouter.use(requireAuth);

// Both ADMIN and ACCOUNTANT can create/edit/finalize/submit invoices — see docs/RBAC.md.
invoiceRouter.get("/", invoiceController.list);
invoiceRouter.get("/:id", invoiceController.getById);
invoiceRouter.post("/", invoiceController.create);
invoiceRouter.patch("/:id", invoiceController.update);
invoiceRouter.post("/:id/finalize", invoiceController.finalize);
invoiceRouter.post("/:id/reset-to-draft", invoiceController.resetToDraft);
invoiceRouter.post("/:id/submit-fbr", fbrController.submitToFbr);
invoiceRouter.get("/:id/fbr-status", fbrController.getInvoiceFbrStatus);
invoiceRouter.get("/:id/pdf", invoiceController.downloadPdf);
