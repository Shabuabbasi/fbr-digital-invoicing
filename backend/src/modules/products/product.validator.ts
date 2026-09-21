import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(64),
  description: z.string().max(2000).optional().default(""),
  unit: z.string().min(1).max(32),
  salePriceMinor: z.number().int().min(0),
  taxRateBasisPoints: z.number().int().min(0).max(10000).default(0),
  // FBR HS Code, e.g. "0101.2100" — required before this product can go on an invoice
  // submitted to FBR (not required to create the product itself).
  hsCode: z.string().max(32).optional().default(""),
  isActive: z.boolean().optional().default(true),
  stockQty: z.number().int().min(0).nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();
