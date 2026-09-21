import type { Request } from "express";
import { Product } from "../../models/Product";
import { ApiError } from "../../utils/ApiError";
import { companyFilter, withTenant } from "../../middleware/tenant";
import { parsePagination } from "../../utils/pagination";
import type { z } from "zod";
import type { createProductSchema, updateProductSchema } from "./product.validator";

export async function listProducts(req: Request) {
  const { page, limit, skip } = parsePagination(req);
  const filter: Record<string, unknown> = { ...companyFilter(req) };

  if (req.query.search) {
    const search = String(req.query.search);
    filter.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getProductById(req: Request, id: string) {
  const product = await Product.findOne(withTenant(req, { _id: id }));
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function createProduct(req: Request, input: z.infer<typeof createProductSchema>) {
  const existing = await Product.findOne({ ...companyFilter(req), sku: input.sku });
  if (existing) throw ApiError.conflict("A product with this SKU already exists");

  return Product.create({ ...input, ...companyFilter(req) });
}

export async function updateProduct(req: Request, id: string, input: z.infer<typeof updateProductSchema>) {
  if (input.sku) {
    const existing = await Product.findOne({ ...companyFilter(req), sku: input.sku, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("A product with this SKU already exists");
  }

  const product = await Product.findOneAndUpdate(withTenant(req, { _id: id }), input, { new: true });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function deactivateProduct(req: Request, id: string) {
  const product = await Product.findOneAndUpdate(withTenant(req, { _id: id }), { isActive: false }, { new: true });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}
