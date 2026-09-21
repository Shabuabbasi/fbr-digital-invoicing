import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { createProductSchema, updateProductSchema } from "./product.validator";
import * as productService from "./product.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.listProducts(req);
  res.status(200).json({ success: true, data: result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req, String(req.params.id));
  res.status(200).json({ success: true, data: product });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid product data");
  const product = await productService.createProduct(req, parsed.data);
  res.status(201).json({ success: true, data: product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid product data");
  const product = await productService.updateProduct(req, String(req.params.id), parsed.data);
  res.status(200).json({ success: true, data: product });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.deactivateProduct(req, String(req.params.id));
  res.status(200).json({ success: true, data: product });
});
