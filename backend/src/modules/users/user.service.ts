import type { Request } from "express";
import bcrypt from "bcryptjs";
import { User } from "../../models/User";
import { ApiError } from "../../utils/ApiError";
import { companyFilter, withTenant } from "../../middleware/tenant";
import { parsePagination } from "../../utils/pagination";
import type { z } from "zod";
import type { createUserSchema, updateUserSchema } from "./user.validator";

// passwordHash is excluded via schema `select: false` — never returned to the client.

export async function listUsers(req: Request) {
  const { page, limit, skip } = parsePagination(req);
  const filter = { ...companyFilter(req) };

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function createUser(req: Request, input: z.infer<typeof createUserSchema>) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);
  return User.create({
    ...companyFilter(req),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    isActive: true,
  });
}

export async function updateUser(req: Request, id: string, input: z.infer<typeof updateUserSchema>) {
  if (id === req.user!.sub && input.isActive === false) {
    throw ApiError.badRequest("You cannot deactivate your own account");
  }
  if (id === req.user!.sub && input.role && input.role !== req.user!.role) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  const user = await User.findOneAndUpdate(withTenant(req, { _id: id }), input, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}
