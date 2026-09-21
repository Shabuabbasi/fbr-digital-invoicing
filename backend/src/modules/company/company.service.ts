import type { Request } from "express";
import { Company } from "../../models/Company";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import type { z } from "zod";
import type { updateCompanySchema } from "./company.validator";

export async function getCompany(req: Request) {
  const company = await Company.findById(req.user!.companyId);
  if (!company) throw ApiError.notFound("Company not found");
  return company;
}

export async function updateCompany(req: Request, input: z.infer<typeof updateCompanySchema>) {
  const { fbrSaleType, ...rest } = input;
  const update: Record<string, unknown> = { ...rest };
  if (fbrSaleType) update["fbrConfig.saleType"] = fbrSaleType;

  const company = await Company.findByIdAndUpdate(req.user!.companyId, update, { new: true });
  if (!company) throw ApiError.notFound("Company not found");
  return company;
}

// Credentials never live in the database or in this response — only in server env vars.
// See docs/FBR-INTEGRATION.md. isConfigured reflects whether the server process has them set.
export async function getFbrSettings(req: Request) {
  const company = await Company.findById(req.user!.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  return {
    environment: company.fbrConfig?.environment ?? "SANDBOX",
    saleType: company.fbrConfig?.saleType ?? "GOODS",
    isConfigured: Boolean(env.fbr.apiBaseUrl && env.fbr.apiToken),
  };
}

export async function updateFbrEnvironment(req: Request, environment: "SANDBOX" | "PRODUCTION") {
  const company = await Company.findByIdAndUpdate(
    req.user!.companyId,
    { "fbrConfig.environment": environment },
    { new: true },
  );
  if (!company) throw ApiError.notFound("Company not found");

  return {
    environment: company.fbrConfig?.environment ?? "SANDBOX",
    isConfigured: Boolean(env.fbr.apiBaseUrl && env.fbr.apiToken),
  };
}
