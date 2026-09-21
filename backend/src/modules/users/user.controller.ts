import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { createUserSchema, updateUserSchema } from "./user.validator";
import * as userService from "./user.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.listUsers(req);
  res.status(200).json({ success: true, data: result });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid user data");
  const user = await userService.createUser(req, parsed.data);
  res.status(201).json({ success: true, data: user });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Invalid user data");
  const user = await userService.updateUser(req, String(req.params.id), parsed.data);
  res.status(200).json({ success: true, data: user });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req, String(req.params.id), { isActive: false });
  res.status(200).json({ success: true, data: user });
});
