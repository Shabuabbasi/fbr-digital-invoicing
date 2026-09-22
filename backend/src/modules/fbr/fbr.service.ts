import type { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { Invoice } from "../../models/Invoice";
import { Company } from "../../models/Company";
import { FbrSubmission } from "../../models/FbrSubmission";
import { ApiError } from "../../utils/ApiError";
import { withTenant, companyFilter } from "../../middleware/tenant";
import { parsePagination } from "../../utils/pagination";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { validateInvoiceForFbr } from "./fbr.validator";
import { buildFbrPayload } from "./fbr.mapper";
import { submitInvoice as callFbrApi } from "./fbr.client";
import { FbrError } from "./fbr.errors";

// Protects against duplicate FBR submissions from a frontend retry: the atomic status
// transition below only succeeds for one concurrent request. See docs/FBR-INTEGRATION.md
// "Idempotency / duplicate submission protection".
export async function submitInvoiceToFbr(req: Request, invoiceId: string) {
  const invoice = await Invoice.findOne(withTenant(req, { _id: invoiceId }));
  if (!invoice) throw ApiError.notFound("Invoice not found");

  validateInvoiceForFbr(invoice);

  const locked = await Invoice.findOneAndUpdate(
    { _id: invoiceId, ...companyFilter(req), status: invoice.status },
    { status: "SUBMITTING", fbrStatus: "PENDING" },
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

  try {
    const result = await callFbrApi(payload, requestId);

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
  } catch (err) {
    const isFbrError = err instanceof FbrError;
    const errorCode = isFbrError ? err.code : "UNKNOWN_ERROR";
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error submitting to FBR";

    logger.error("FBR submission failed", {
      invoiceId: String(locked._id),
      requestId,
      errorCode,
      errorMessage,
    });

    submission.httpStatus = isFbrError ? (err.httpStatus ?? null) : null;
    submission.errorCode = errorCode;
    submission.errorMessage = errorMessage;
    submission.respondedAt = new Date();
    await submission.save();

    locked.set({
      status: "FAILED",
      fbrStatus: "FAILED",
      fbrLastSubmissionId: submission._id,
    });
    await locked.save();

    if (errorCode === "FBR_TIMEOUT") {
      throw ApiError.gatewayTimeout(errorMessage, "FBR_TIMEOUT");
    }
    if (errorCode === "FBR_SERVER_ERROR") {
      throw ApiError.badGateway(errorMessage, "FBR_SERVER_ERROR");
    }
    throw ApiError.badRequest(errorMessage, "FBR_SUBMISSION_ERROR");
  }
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
