import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { updateCompanySchema } from "./company.validator";
import * as companyService from "./company.service";
import { z } from "zod";

export const getCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.getCompany(req);
  res.status(200).json({ success: true, data: company });
});

export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateCompanySchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid company data");
  const company = await companyService.updateCompany(req, parsed.data);
  res.status(200).json({ success: true, data: company });
});

export const getFbrSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await companyService.getFbrSettings(req);
  res.status(200).json({ success: true, data: settings });
});

const fbrEnvironmentSchema = z.object({ environment: z.enum(["SANDBOX", "PRODUCTION"]) });

export const updateFbrSettings = asyncHandler(async (req: Request, res: Response) => {
  const parsed = fbrEnvironmentSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("environment must be SANDBOX or PRODUCTION");
  const settings = await companyService.updateFbrEnvironment(req, parsed.data.environment);
  res.status(200).json({ success: true, data: settings });
});
