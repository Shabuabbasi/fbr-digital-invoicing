import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as fbrService from "./fbr.service";
import { reconcileInvoiceSchema } from "./fbr.validator";

export const submitToFbr = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await fbrService.submitInvoiceToFbr(req, String(req.params.id));
  res.status(200).json({ success: true, data: invoice });
});

export const reconcileInvoice = asyncHandler(async (req: Request, res: Response) => {
  const parsed = reconcileInvoiceSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid reconciliation data");
  const invoice = await fbrService.reconcileInvoice(req, String(req.params.id), parsed.data);
  res.status(200).json({ success: true, data: invoice });
});

export const getInvoiceFbrStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await fbrService.getInvoiceFbrStatus(req, String(req.params.id));
  res.status(200).json({ success: true, data: status });
});

export const listSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await fbrService.listSubmissions(req);
  res.status(200).json({ success: true, data: result });
});

export const getSubmissionById = asyncHandler(async (req: Request, res: Response) => {
  const submission = await fbrService.getSubmissionById(req, String(req.params.id));
  res.status(200).json({ success: true, data: submission });
});
