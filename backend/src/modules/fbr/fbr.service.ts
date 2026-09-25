import type { Request } from "express";
import { Types, type HydratedDocument } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Invoice, type InvoiceDocument } from "../../models/Invoice";
import { Company } from "../../models/Company";
import { FbrSubmission, type FbrSubmissionDocument } from "../../models/FbrSubmission";
import { ApiError } from "../../utils/ApiError";
import { withTenant, companyFilter } from "../../middleware/tenant";
import { parsePagination } from "../../utils/pagination";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { validateInvoiceForFbr, type ReconcileInvoiceInput } from "./fbr.validator";
import { buildFbrPayload } from "./fbr.mapper";
import { submitInvoice as callFbrApi } from "./fbr.client";
import { FbrError, FbrOutcomeUnknownError } from "./fbr.errors";
import type { FbrSubmitResult } from "./fbr.types";

// Protects against duplicate FBR submissions from a frontend retry: the atomic status
// transition below only succeeds for one concurrent request. See docs/FBR-INTEGRATION.md
// "Idempotency / duplicate submission protection".
export async function submitInvoiceToFbr(req: Request, invoiceId: string) {
  const invoice = await Invoice.findOne(withTenant(req, { _id: invoiceId }));
  if (!invoice) throw ApiError.notFound("Invoice not found");

  validateInvoiceForFbr(invoice);

  const locked = await Invoice.findOneAndUpdate(
    { _id: invoiceId, ...companyFilter(req), status: invoice.status },
    { status: "SUBMITTING", fbrStatus: "PENDING", fbrSubmissionStartedAt: new Date() },
    { new: true },
  );
  if (!locked) {
    throw ApiError.conflict(
      "This invoice is already being submitted to FBR",
      "FBR_SUBMISSION_IN_PROGRESS",
    );
  }

  const attemptNumber =
    (await FbrSubmission.countDocuments({ invoiceId: locked._id })) + 1;
  const requestId = uuidv4();
  const company = await Company.findById(locked.companyId);
  const payload = buildFbrPayload(
    locked,
    env.fbr.environment,
    company?.fbrConfig?.saleType ?? "GOODS",
  );

  const submission = await FbrSubmission.create({
    invoiceId: locked._id,
    companyId: locked.companyId,
    environment: env.fbr.environment,
    attemptNumber,
    requestId,
    requestPayload: payload,
    requestedAt: new Date(),
  });

  // Only the FBR call itself is inside this try: a database error AFTER FBR accepted the
  // invoice must never be recorded as an FBR failure (that would allow a duplicate resubmit).
  let result: FbrSubmitResult;
  try {
    result = await callFbrApi(payload, requestId);
  } catch (err) {
    throw await recordFailedAttempt(locked, submission, requestId, err);
  }

  // Logged before persisting so the FBR invoice number is never lost if the writes below fail;
  // in that case the invoice stays SUBMITTING and fbr.recovery.ts resolves it.
  logger.info("FBR accepted invoice", {
    invoiceId: String(locked._id),
    requestId,
    fbrReferenceNumber: result.fbrReferenceNumber,
  });

  submission.httpStatus = result.httpStatus;
  submission.fbrResponseStatus = result.fbrResponseStatus;
  submission.fbrReferenceNumber = result.fbrReferenceNumber;
  submission.respondedAt = new Date();
  await submission.save();

  locked.set({
    status: "SUBMITTED",
    fbrStatus: "SUBMITTED",
    fbrReferenceNumber: result.fbrReferenceNumber,
    fbrLastSubmissionId: submission._id,
  });
  await locked.save();

  return locked;
}

// Records a failed/unknown attempt and returns the ApiError to send to the client.
// Definite failures (explicit FBR rejection, 401, not configured) -> FAILED, may be resubmitted.
// Unknown outcomes (timeout, network, 5xx) -> RECONCILIATION_REQUIRED, resubmission blocked.
async function recordFailedAttempt(
  locked: HydratedDocument<InvoiceDocument>,
  submission: HydratedDocument<FbrSubmissionDocument>,
  requestId: string,
  err: unknown,
): Promise<ApiError> {
  const isFbrError = err instanceof FbrError;
  const outcomeUnknown = !isFbrError || err instanceof FbrOutcomeUnknownError;
  const errorCode = isFbrError ? err.code : "UNKNOWN_ERROR";
  const errorMessage =
    err instanceof Error ? err.message : "Unknown error submitting to FBR";

  logger.error("FBR submission failed", {
    invoiceId: String(locked._id),
    requestId,
    errorCode,
    errorMessage,
    outcomeUnknown,
  });

  submission.httpStatus = isFbrError ? (err.httpStatus ?? null) : null;
  submission.errorCode = errorCode;
  submission.errorMessage = errorMessage;
  submission.respondedAt = new Date();
  await submission.save();

  locked.set({
    status: outcomeUnknown ? "RECONCILIATION_REQUIRED" : "FAILED",
    fbrStatus: outcomeUnknown ? "UNKNOWN" : "FAILED",
    fbrLastSubmissionId: submission._id,
  });
  await locked.save();

  if (outcomeUnknown) {
    const message =
      `${errorMessage}. FBR may have received this invoice, so it has not been marked as ` +
      "failed and cannot be resubmitted. An administrator must check it in the IRIS portal " +
      "and reconcile it.";
    return errorCode === "FBR_TIMEOUT"
      ? ApiError.gatewayTimeout(message, "FBR_OUTCOME_UNKNOWN")
      : ApiError.badGateway(message, "FBR_OUTCOME_UNKNOWN");
  }
  return ApiError.badRequest(errorMessage, "FBR_SUBMISSION_ERROR");
}

// Manual resolution of a RECONCILIATION_REQUIRED invoice after an admin has checked IRIS.
// ACCEPTED_BY_FBR -> SUBMITTED with the FBR invoice number; NOT_RECEIVED_BY_FBR -> FAILED
// (which re-enables the normal resubmit / reset-to-draft path). Never calls FBR.
export async function reconcileInvoice(
  req: Request,
  invoiceId: string,
  input: ReconcileInvoiceInput,
) {
  const accepted = input.outcome === "ACCEPTED_BY_FBR";
  const fbrReferenceNumber = accepted ? input.fbrReferenceNumber : null;

  const invoice = await Invoice.findOneAndUpdate(
    withTenant(req, { _id: invoiceId, status: "RECONCILIATION_REQUIRED" }),
    accepted
      ? { status: "SUBMITTED", fbrStatus: "SUBMITTED", fbrReferenceNumber }
      : { status: "FAILED", fbrStatus: "FAILED" },
    { new: true },
  );
  if (!invoice) {
    const exists = await Invoice.exists(withTenant(req, { _id: invoiceId }));
    if (!exists) throw ApiError.notFound("Invoice not found");
    throw ApiError.conflict(
      "Only invoices awaiting FBR reconciliation can be reconciled",
      "INVOICE_NOT_AWAITING_RECONCILIATION",
    );
  }

  if (invoice.fbrLastSubmissionId) {
    await FbrSubmission.updateOne(
      { _id: invoice.fbrLastSubmissionId },
      {
        reconciliation: {
          outcome: input.outcome,
          fbrReferenceNumber,
          note: input.note ?? "",
          reconciledBy: new Types.ObjectId(req.user!.sub),
          reconciledAt: new Date(),
        },
      },
    );
  }

  logger.warn("FBR submission manually reconciled", {
    invoiceId: String(invoice._id),
    outcome: input.outcome,
    fbrReferenceNumber,
    reconciledBy: req.user!.sub,
  });

  return invoice;
}

export async function getInvoiceFbrStatus(req: Request, invoiceId: string) {
  const invoice = await Invoice.findOne(withTenant(req, { _id: invoiceId }));
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const latestSubmission = invoice.fbrLastSubmissionId
    ? await FbrSubmission.findById(invoice.fbrLastSubmissionId)
    : null;

  return {
    status: invoice.status,
    fbrStatus: invoice.fbrStatus,
    fbrReferenceNumber: invoice.fbrReferenceNumber,
    latestSubmission,
  };
}

export async function listSubmissions(req: Request) {
  const { page, limit, skip } = parsePagination(req);
  const filter: Record<string, unknown> = { ...companyFilter(req) };
  if (req.query.invoiceId) filter.invoiceId = req.query.invoiceId;

  const [items, total] = await Promise.all([
    FbrSubmission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    FbrSubmission.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getSubmissionById(req: Request, id: string) {
  const submission = await FbrSubmission.findOne(withTenant(req, { _id: id }));
  if (!submission) throw ApiError.notFound("Submission not found");
  return submission;
}
