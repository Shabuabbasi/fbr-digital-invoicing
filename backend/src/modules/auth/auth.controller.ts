import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { loginSchema, updateAvatarSchema } from "./auth.validator";
import { getCurrentUserContext, loginWithCredentials, updateOwnAvatar } from "./auth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Email and password are required");
  }
  const result = await loginWithCredentials(parsed.data.email, parsed.data.password);
  res.status(200).json({ success: true, data: result });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await getCurrentUserContext(req.user.sub, req.user.companyId);
  res.status(200).json({ success: true, data: result });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // Stateless JWT — logout is a client-side token discard. Endpoint kept for audit/consistency.
  res.status(200).json({ success: true, data: null, message: "Logged out" });
});

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const parsed = updateAvatarSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid image");
  }
  const user = await updateOwnAvatar(req.user.sub, parsed.data.avatarUrl);
  res.status(200).json({ success: true, data: user });
});
