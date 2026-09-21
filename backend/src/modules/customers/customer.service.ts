import type { Request } from "express";
import { Customer } from "../../models/Customer";
import { ApiError } from "../../utils/ApiError";
import { companyFilter, withTenant } from "../../middleware/tenant";
import { parsePagination } from "../../utils/pagination";
import type { z } from "zod";
import type { createCustomerSchema, updateCustomerSchema } from "./customer.validator";

export async function listCustomers(req: Request) {
  const { page, limit, skip } = parsePagination(req);
  const filter: Record<string, unknown> = { ...companyFilter(req) };

  if (req.query.search) {
    const search = String(req.query.search);
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { businessName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Customer.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getCustomerById(req: Request, id: string) {
  const customer = await Customer.findOne(withTenant(req, { _id: id }));
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}

export async function createCustomer(req: Request, input: z.infer<typeof createCustomerSchema>) {
  return Customer.create({ ...input, ...companyFilter(req) });
}

export async function updateCustomer(req: Request, id: string, input: z.infer<typeof updateCustomerSchema>) {
  const customer = await Customer.findOneAndUpdate(withTenant(req, { _id: id }), input, { new: true });
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}

export async function deactivateCustomer(req: Request, id: string) {
  const customer = await Customer.findOneAndUpdate(withTenant(req, { _id: id }), { isActive: false }, { new: true });
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}
