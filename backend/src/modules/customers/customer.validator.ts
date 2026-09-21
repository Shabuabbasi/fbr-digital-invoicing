import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  businessName: z.string().max(200).optional().default(""),
  ntn: z.string().max(32).optional().default(""),
  strn: z.string().max(32).optional().default(""),
  cnic: z.string().max(32).optional().default(""),
  phone: z.string().max(32).optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  address: z.string().max(300).optional().default(""),
  city: z.string().max(100).optional().default(""),
  province: z.string().max(100).optional().default(""),
  customerType: z.enum(["INDIVIDUAL", "BUSINESS"]),
  isActive: z.boolean().optional().default(true),
});

export const updateCustomerSchema = createCustomerSchema.partial();
