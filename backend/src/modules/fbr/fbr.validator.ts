import type { InvoiceDocument } from "../../models/Invoice";
import type { HydratedDocument } from "mongoose";
import { z } from "zod";
import { ApiError } from "../../utils/ApiError";

// Pre-submission checks matching required fields in the official PRAL Technical Specification
// for DI API v1.12 §4.1 — see docs/FBR-INTEGRATION.md. Catching these here gives a clear,
// actionable error before we ever call FBR, instead of a cryptic rejection from their API.
export function validateInvoiceForFbr(invoice: HydratedDocument<InvoiceDocument>): void {
  if (invoice.status === "RECONCILIATION_REQUIRED") {
    throw ApiError.conflict(
      "FBR may already have received this invoice. It cannot be submitted again until an " +
        "administrator checks it in the IRIS portal and reconciles it.",
      "FBR_RECONCILIATION_REQUIRED",
    );
  }
  if (invoice.status !== "READY_FOR_SUBMISSION" && invoice.status !== "FAILED") {
    throw ApiError.conflict(
      "Invoice must be finalized (READY_FOR_SUBMISSION) before submitting to FBR",
      "INVOICE_NOT_READY",
    );
  }
  if (invoice.items.length === 0) {
    throw ApiError.badRequest("Invoice has no line items");
  }
  if (!invoice.sellerSnapshot.ntn) {
    throw ApiError.badRequest("Company NTN is required before submitting to FBR — set it in Company Settings");
  }
  if (!invoice.sellerSnapshot.province) {
    throw ApiError.badRequest("Company province is required before submitting to FBR — set it in Company Settings");
  }
  if (!invoice.buyerSnapshot.ntn && !invoice.buyerSnapshot.cnic) {
    throw ApiError.badRequest("Customer NTN or CNIC is required before submitting to FBR");
  }
  if (!invoice.buyerSnapshot.province) {
    throw ApiError.badRequest("Customer province is required before submitting to FBR");
  }

  const missingHsCode = invoice.items.find((item) => !item.hsCode);
  if (missingHsCode) {
    throw ApiError.badRequest(
      `Product "${missingHsCode.productName}" is missing an HS Code — set it on the product before submitting to FBR`,
    );
  }
}

// Admin's manual resolution of an invoice whose FBR outcome is unknown, after checking IRIS.
export const reconcileInvoiceSchema = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("ACCEPTED_BY_FBR"),
    fbrReferenceNumber: z.string().trim().min(1, "FBR invoice number is required"),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    outcome: z.literal("NOT_RECEIVED_BY_FBR"),
    note: z.string().trim().max(500).optional(),
  }),
]);

export type ReconcileInvoiceInput = z.infer<typeof reconcileInvoiceSchema>;
