import { z } from "zod";

const itemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  discountMinor: z.number().int().min(0).optional().default(0),
  // unitPriceMinor and taxRateBasisPoints are looked up from the Product record server-side,
  // never trusted from the client — see docs/API.md "Invoices".
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  invoiceDate: z.coerce.date().optional(),
  items: z.array(itemInputSchema).min(1, "At least one line item is required"),
});

export const updateInvoiceSchema = createInvoiceSchema;
