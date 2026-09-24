import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional().or(z.literal("")),
  ntn: z.string().max(32).optional(),
  strn: z.string().max(32).optional(),
  businessType: z.string().max(100).optional(),
  invoicePrefix: z.string().min(1).max(16).optional(),
  fbrSaleType: z.enum(["GOODS", "SERVICES", "SERVICES_FED_ST"]).optional(),
});
