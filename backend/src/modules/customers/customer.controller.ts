import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { createCustomerSchema, updateCustomerSchema } from "./customer.validator";
import * as customerService from "./customer.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.listCustomers(req);
  res.status(200).json({ success: true, data: result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerById(req, String(req.params.id));
  res.status(200).json({ success: true, data: customer });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid customer data");
  const customer = await customerService.createCustomer(req, parsed.data);
  res.status(201).json({ success: true, data: customer });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid customer data");
  const customer = await customerService.updateCustomer(req, String(req.params.id), parsed.data);
  res.status(200).json({ success: true, data: customer });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.deactivateCustomer(req, String(req.params.id));
  res.status(200).json({ success: true, data: customer });
});
