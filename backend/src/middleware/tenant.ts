import type { Request } from "express";
import { Types } from "mongoose";
import { ApiError } from "../utils/ApiError";

// Every company-owned query MUST go through this helper so tenant scoping can never be
// accidentally skipped. See docs/DATABASE.md "Multi-tenancy enforcement".
export function companyFilter(req: Request): { companyId: Types.ObjectId } {
  if (!req.user) throw ApiError.unauthorized();
  return { companyId: new Types.ObjectId(req.user.companyId) };
}

export function withTenant<T extends Record<string, unknown>>(req: Request, query: T): T & { companyId: Types.ObjectId } {
  return { ...query, ...companyFilter(req) };
}
