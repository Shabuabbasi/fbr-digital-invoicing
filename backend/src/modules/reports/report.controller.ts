import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as reportService from "./report.service";

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getSalesReport(req);
  res.status(200).json({ success: true, data: result });
});

export const getInvoiceReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getInvoiceReport(req);
  res.status(200).json({ success: true, data: result });
});

export const getTaxReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getTaxReport(req);
  res.status(200).json({ success: true, data: result });
});

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getDashboardSummary(req);
  res.status(200).json({ success: true, data: result });
});
