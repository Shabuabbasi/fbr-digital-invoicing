import type { InvoiceDocument } from "../../models/Invoice";
import type { HydratedDocument } from "mongoose";
import { ApiError } from "../../utils/ApiError";

// Pre-submission checks matching required fields in the official PRAL Technical Specification
// for DI API v1.12 §4.1 — see docs/FBR-INTEGRATION.md. Catching these here gives a clear,
// actionable error before we ever call FBR, instead of a cryptic rejection from their API.
export function validateInvoiceForFbr(invoice: HydratedDocument<InvoiceDocument>): void {
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
