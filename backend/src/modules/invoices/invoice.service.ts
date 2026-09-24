import type { Request } from "express";
import mongoose, { Types } from "mongoose";
import { Invoice } from "../../models/Invoice";
import { Company } from "../../models/Company";
import { Customer } from "../../models/Customer";
import { Product } from "../../models/Product";
import { ApiError } from "../../utils/ApiError";
import { companyFilter, withTenant } from "../../middleware/tenant";
import { parsePagination } from "../../utils/pagination";
import { calculateInvoice, type CalculatedItemInput } from "./invoice.calculator";
import type { z } from "zod";
import type { createInvoiceSchema } from "./invoice.validator";

type InvoiceInput = z.infer<typeof createInvoiceSchema>;

async function resolveLineItems(req: Request, items: InvoiceInput["items"]): Promise<CalculatedItemInput[]> {
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ ...companyFilter(req), _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  return items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw ApiError.badRequest(`Product ${item.productId} not found`);
    if (!product.isActive) throw ApiError.badRequest(`Product "${product.name}" is inactive`);
    if (item.discountMinor > product.salePriceMinor * item.quantity) {
      throw ApiError.badRequest(`Discount exceeds line total for "${product.name}"`);
    }

    return {
      productId: product._id.toString(),
      productName: product.name,
      hsCode: product.hsCode,
      unit: product.unit,
      quantity: item.quantity,
      unitPriceMinor: product.salePriceMinor,
      discountMinor: item.discountMinor,
      taxRateBasisPoints: product.taxRateBasisPoints,
    };
  });
}

async function resolveCustomer(req: Request, customerId: string) {
  const customer = await Customer.findOne(withTenant(req, { _id: customerId }));
  if (!customer) throw ApiError.badRequest("Customer not found");
  if (!customer.isActive) throw ApiError.badRequest("Customer is inactive");
  return customer;
}

export async function listInvoices(req: Request) {
  const { page, limit, skip } = parsePagination(req);
  const filter: Record<string, unknown> = { ...companyFilter(req) };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.fbrStatus) filter.fbrStatus = req.query.fbrStatus;
  if (req.query.customerId) filter.customerId = req.query.customerId;
  if (req.query.from || req.query.to) {
    const range: Record<string, Date> = {};
    if (req.query.from) range.$gte = new Date(String(req.query.from));
    if (req.query.to) range.$lte = new Date(String(req.query.to));
    filter.invoiceDate = range;
  }

  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("customerId", "name businessName"),
    Invoice.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getInvoiceById(req: Request, id: string) {
  const invoice = await Invoice.findOne(withTenant(req, { _id: id })).populate("customerId", "name businessName");
  if (!invoice) throw ApiError.notFound("Invoice not found");
  return invoice;
}

export async function createInvoice(req: Request, input: InvoiceInput) {
  const customer = await resolveCustomer(req, input.customerId);
  const resolvedItems = await resolveLineItems(req, input.items);
  const calculated = calculateInvoice(resolvedItems);

  const session = await mongoose.startSession();
  try {
    let invoice;
    await session.withTransaction(async () => {
      const company = await Company.findByIdAndUpdate(
        req.user!.companyId,
        { $inc: { invoiceNumberSeq: 1 } },
        { new: true, session },
      );
      if (!company) throw ApiError.notFound("Company not found");

      const invoiceNumber = `${company.invoicePrefix}-${String(company.invoiceNumberSeq).padStart(5, "0")}`;

      const created = await Invoice.create(
        [
          {
            companyId: new Types.ObjectId(req.user!.companyId),
            invoiceNumber,
            invoiceDate: input.invoiceDate ?? new Date(),
            customerId: customer._id,
            sellerSnapshot: {
              name: company.name,
              ntn: company.ntn,
              strn: company.strn,
              address: company.address,
              province: company.province,
            },
            buyerSnapshot: {
              name: customer.name,
              ntn: customer.ntn,
              strn: customer.strn,
              cnic: customer.cnic,
              address: customer.address,
              province: customer.province,
            },
            items: calculated.items,
            subtotalMinor: calculated.subtotalMinor,
            discountMinor: calculated.discountMinor,
            taxMinor: calculated.taxMinor,
            totalMinor: calculated.totalMinor,
            status: "DRAFT",
            fbrStatus: "NOT_SUBMITTED",
            createdBy: new Types.ObjectId(req.user!.sub),
          },
        ],
        { session },
      );
      invoice = created[0];
    });
    return invoice;
  } finally {
    await session.endSession();
  }
}

export async function resetInvoiceToDraft(req: Request, id: string) {
  const invoice = await Invoice.findOne(withTenant(req, { _id: id }));
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status !== "FAILED") {
    throw ApiError.conflict(
      "Only FAILED invoices can be reset to draft",
      "INVOICE_NOT_FAILED",
    );
  }

  invoice.set({ status: "DRAFT", fbrStatus: "NOT_SUBMITTED", fbrReferenceNumber: null });
  await invoice.save();
  return invoice;
}

export async function updateInvoice(req: Request, id: string, input: InvoiceInput) {
  const invoice = await Invoice.findOne(withTenant(req, { _id: id }));
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status !== "DRAFT") {
    throw ApiError.conflict("Only draft invoices can be edited", "INVOICE_NOT_EDITABLE");
  }

  const customer = await resolveCustomer(req, input.customerId);
  const resolvedItems = await resolveLineItems(req, input.items);
  const calculated = calculateInvoice(resolvedItems);

  invoice.set({
    customerId: customer._id,
    buyerSnapshot: {
      name: customer.name,
      ntn: customer.ntn,
      strn: customer.strn,
      cnic: customer.cnic,
      address: customer.address,
      province: customer.province,
    },
    items: calculated.items,
    subtotalMinor: calculated.subtotalMinor,
    discountMinor: calculated.discountMinor,
    taxMinor: calculated.taxMinor,
    totalMinor: calculated.totalMinor,
    ...(input.invoiceDate ? { invoiceDate: input.invoiceDate } : {}),
  });

  await invoice.save();
  return invoice;
}

export async function finalizeInvoice(req: Request, id: string) {
  const invoice = await Invoice.findOne(withTenant(req, { _id: id }));
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status !== "DRAFT") {
    throw ApiError.conflict("Only draft invoices can be finalized", "INVOICE_NOT_DRAFT");
  }

  invoice.status = "READY_FOR_SUBMISSION";
  await invoice.save();
  return invoice;
}
