import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { createInvoiceSchema, updateInvoiceSchema } from "./invoice.validator";
import * as invoiceService from "./invoice.service";
import { streamInvoicePdf } from "./invoice.pdf";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await invoiceService.listInvoices(req);
  res.status(200).json({ success: true, data: result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(req, String(req.params.id));
  res.status(200).json({ success: true, data: invoice });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid invoice data");
  const invoice = await invoiceService.createInvoice(req, parsed.data);
  res.status(201).json({ success: true, data: invoice });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid invoice data");
  const invoice = await invoiceService.updateInvoice(req, String(req.params.id), parsed.data);
  res.status(200).json({ success: true, data: invoice });
});

export const finalize = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.finalizeInvoice(req, String(req.params.id));
  res.status(200).json({ success: true, data: invoice });
});

export const downloadPdf = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(req, String(req.params.id));
  streamInvoicePdf(invoice, res);
});
