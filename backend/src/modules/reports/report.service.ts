import type { Request } from "express";
import { Invoice } from "../../models/Invoice";
import { companyFilter } from "../../middleware/tenant";
import { ApiError } from "../../utils/ApiError";

function resolveDateRange(req: Request): { from: Date; to: Date } {
  const now = new Date();
  const range = String(req.query.range ?? "month");

  if (range === "custom") {
    if (!req.query.from || !req.query.to) {
      throw ApiError.badRequest("from and to are required for a custom range");
    }
    return { from: new Date(String(req.query.from)), to: new Date(String(req.query.to)) };
  }

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (range === "today") {
    return { from: startOfDay(now), to: now };
  }
  if (range === "week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from: startOfDay(from), to: now };
  }
  // default: this month
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
}

// Draft invoices aren't finalized sales — reports exclude them. This is a documented MVP
// assumption (spec doesn't specify); see docs/DEVELOPMENT-PLAN.md.
const NON_DRAFT = { $ne: "DRAFT" };

export async function getSalesReport(req: Request) {
  const { from, to } = resolveDateRange(req);
  const filter = { ...companyFilter(req), invoiceDate: { $gte: from, $lte: to }, status: NON_DRAFT };

  const [agg] = await Invoice.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        invoiceCount: { $sum: 1 },
        grossSalesMinor: { $sum: "$subtotalMinor" },
        taxMinor: { $sum: "$taxMinor" },
        discountMinor: { $sum: "$discountMinor" },
        netSalesMinor: { $sum: "$totalMinor" },
      },
    },
  ]);

  return {
    from,
    to,
    invoiceCount: agg?.invoiceCount ?? 0,
    grossSalesMinor: agg?.grossSalesMinor ?? 0,
    taxMinor: agg?.taxMinor ?? 0,
    discountMinor: agg?.discountMinor ?? 0,
    netSalesMinor: agg?.netSalesMinor ?? 0,
  };
}

export async function getInvoiceReport(req: Request) {
  const filter: Record<string, unknown> = { ...companyFilter(req) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.fbrStatus) filter.fbrStatus = req.query.fbrStatus;
  if (req.query.from || req.query.to) {
    const range: Record<string, Date> = {};
    if (req.query.from) range.$gte = new Date(String(req.query.from));
    if (req.query.to) range.$lte = new Date(String(req.query.to));
    filter.invoiceDate = range;
  }

  const invoices = await Invoice.find(filter)
    .sort({ invoiceDate: -1 })
    .limit(500)
    .populate("customerId", "name businessName")
    .select("invoiceNumber invoiceDate customerId totalMinor status fbrStatus");

  return { items: invoices };
}

export async function getTaxReport(req: Request) {
  const { from, to } = resolveDateRange(req);
  const filter = { ...companyFilter(req), invoiceDate: { $gte: from, $lte: to }, status: NON_DRAFT };

  const rows = await Invoice.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } },
        taxableAmountMinor: { $sum: "$subtotalMinor" },
        taxMinor: { $sum: "$taxMinor" },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    from,
    to,
    rows: rows.map((r) => ({
      date: r._id,
      taxableAmountMinor: r.taxableAmountMinor,
      taxMinor: r.taxMinor,
      invoiceCount: r.invoiceCount,
    })),
  };
}

export async function getDashboardSummary(req: Request) {
  const companyMatch = { ...companyFilter(req) };

  const [totals] = await Invoice.aggregate([
    { $match: { ...companyMatch, status: NON_DRAFT } },
    {
      $group: {
        _id: null,
        totalSalesMinor: { $sum: "$totalMinor" },
        totalInvoices: { $sum: 1 },
        totalTaxMinor: { $sum: "$taxMinor" },
      },
    },
  ]);

  const fbrCounts = await Invoice.aggregate([
    { $match: companyMatch },
    { $group: { _id: "$fbrStatus", count: { $sum: 1 } } },
  ]);
  const fbrCountMap = Object.fromEntries(fbrCounts.map((c) => [c._id, c.count]));

  const recentInvoices = await Invoice.find(companyMatch)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("customerId", "name businessName")
    .select("invoiceNumber invoiceDate customerId totalMinor status fbrStatus");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const salesOverview = await Invoice.aggregate([
    { $match: { ...companyMatch, status: NON_DRAFT, invoiceDate: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } },
        totalMinor: { $sum: "$totalMinor" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    totalSalesMinor: totals?.totalSalesMinor ?? 0,
    totalInvoices: totals?.totalInvoices ?? 0,
    totalTaxMinor: totals?.totalTaxMinor ?? 0,
    fbrSubmitted: fbrCountMap.SUBMITTED ?? 0,
    fbrPending: fbrCountMap.PENDING ?? 0,
    fbrFailed: fbrCountMap.FAILED ?? 0,
    recentInvoices,
    salesOverview: salesOverview.map((s) => ({ date: s._id, totalMinor: s.totalMinor })),
  };
}
