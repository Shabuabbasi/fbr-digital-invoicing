import type { Request } from "express";
import { Types } from "mongoose";
import { Invoice } from "../../models/Invoice";
import { Company } from "../../models/Company";
import { FbrSubmission } from "../../models/FbrSubmission";
import { ApiError } from "../../utils/ApiError";
import { submitInvoice as callFbrApi } from "./fbr.client";
import { FbrOutcomeUnknownError, FbrRejectedError, FbrTimeoutError } from "./fbr.errors";
import { reconcileInvoice, submitInvoiceToFbr } from "./fbr.service";
import { reconcileInvoiceSchema } from "./fbr.validator";
import { resetInvoiceToDraft } from "../invoices/invoice.service";

// Models and the FBR HTTP client are mocked: no database and never any real FBR request.
jest.mock("../../models/Invoice", () => ({
  Invoice: { findOne: jest.fn(), findOneAndUpdate: jest.fn(), exists: jest.fn() },
}));
jest.mock("../../models/Company", () => ({ Company: { findById: jest.fn() } }));
jest.mock("../../models/FbrSubmission", () => ({
  FbrSubmission: { countDocuments: jest.fn(), create: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("./fbr.client", () => ({ submitInvoice: jest.fn() }));
jest.mock("./fbr.mapper", () => ({ buildFbrPayload: jest.fn(() => ({ mapped: true })) }));
jest.mock("../../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const COMPANY_ID = new Types.ObjectId().toString();
const USER_ID = new Types.ObjectId().toString();
const req = { user: { sub: USER_ID, companyId: COMPANY_ID, role: "ADMIN" } } as unknown as Request;

type FakeDoc = Record<string, unknown> & { set: jest.Mock; save: jest.Mock };

function makeInvoice(overrides: Record<string, unknown> = {}): FakeDoc {
  const doc = {
    _id: new Types.ObjectId(),
    companyId: new Types.ObjectId(COMPANY_ID),
    status: "READY_FOR_SUBMISSION",
    fbrStatus: "NOT_SUBMITTED",
    fbrReferenceNumber: null,
    fbrLastSubmissionId: null,
    items: [{ productName: "Widget", hsCode: "0101.2100" }],
    sellerSnapshot: { ntn: "1234567", province: "Sindh" },
    buyerSnapshot: { ntn: "7654321", cnic: "", province: "Punjab" },
    ...overrides,
  } as unknown as FakeDoc;
  doc.set = jest.fn((values: Record<string, unknown>) => Object.assign(doc, values));
  doc.save = jest.fn().mockResolvedValue(doc);
  return doc;
}

function makeSubmission(): FakeDoc {
  const doc = { _id: new Types.ObjectId() } as unknown as FakeDoc;
  doc.save = jest.fn().mockResolvedValue(doc);
  return doc;
}

let invoice: FakeDoc;
let locked: FakeDoc;
let submission: FakeDoc;

function setUpSubmit(status = "READY_FOR_SUBMISSION") {
  invoice = makeInvoice({ status });
  locked = makeInvoice({ _id: invoice._id, status: "SUBMITTING", fbrStatus: "PENDING" });
  submission = makeSubmission();
  (Invoice.findOne as jest.Mock).mockResolvedValue(invoice);
  (Invoice.findOneAndUpdate as jest.Mock).mockResolvedValue(locked);
  (FbrSubmission.countDocuments as jest.Mock).mockResolvedValue(0);
  (FbrSubmission.create as jest.Mock).mockResolvedValue(submission);
  (Company.findById as jest.Mock).mockResolvedValue({ fbrConfig: { saleType: "GOODS" } });
}

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (err) {
    return err as ApiError;
  }
  throw new Error("Expected promise to reject");
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("submitInvoiceToFbr", () => {
  it("stores FBR's reference and marks SUBMITTED on success", async () => {
    setUpSubmit();
    (callFbrApi as jest.Mock).mockResolvedValue({
      httpStatus: 200,
      fbrResponseStatus: "Valid",
      fbrReferenceNumber: "7000007DI1747119701593",
      errorCode: null,
      errorMessage: null,
    });

    const result = await submitInvoiceToFbr(req, String(invoice._id));

    expect(result).toBe(locked);
    expect(locked.status).toBe("SUBMITTED");
    expect(locked.fbrStatus).toBe("SUBMITTED");
    expect(locked.fbrReferenceNumber).toBe("7000007DI1747119701593");
    expect(locked.fbrLastSubmissionId).toBe(submission._id);
    expect(submission.fbrReferenceNumber).toBe("7000007DI1747119701593");
    expect(submission.save).toHaveBeenCalled();
    const lockUpdate = (Invoice.findOneAndUpdate as jest.Mock).mock.calls[0][1];
    expect(lockUpdate.status).toBe("SUBMITTING");
    expect(lockUpdate.fbrSubmissionStartedAt).toBeInstanceOf(Date);
  });

  it("marks FAILED on an explicit FBR rejection so it can be corrected and resubmitted", async () => {
    setUpSubmit();
    (callFbrApi as jest.Mock).mockRejectedValue(new FbrRejectedError("Buyer NTN is invalid", 200));

    const err = await captureError(submitInvoiceToFbr(req, String(invoice._id)));

    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("FBR_SUBMISSION_ERROR");
    expect(locked.status).toBe("FAILED");
    expect(locked.fbrStatus).toBe("FAILED");
    expect(submission.errorCode).toBe("FBR_REJECTED");
    expect(submission.errorMessage).toBe("Buyer NTN is invalid");
  });

  it("marks RECONCILIATION_REQUIRED (not FAILED) on an FBR timeout", async () => {
    setUpSubmit();
    (callFbrApi as jest.Mock).mockRejectedValue(new FbrTimeoutError());

    const err = await captureError(submitInvoiceToFbr(req, String(invoice._id)));

    expect(err.statusCode).toBe(504);
    expect(err.code).toBe("FBR_OUTCOME_UNKNOWN");
    expect(locked.status).toBe("RECONCILIATION_REQUIRED");
    expect(locked.fbrStatus).toBe("UNKNOWN");
    expect(locked.fbrLastSubmissionId).toBe(submission._id);
    // The attempt is kept in the audit log with the original error.
    expect(submission.errorCode).toBe("FBR_TIMEOUT");
    expect(submission.save).toHaveBeenCalled();
  });

  it("marks RECONCILIATION_REQUIRED on a network failure", async () => {
    setUpSubmit();
    (callFbrApi as jest.Mock).mockRejectedValue(
      new FbrOutcomeUnknownError("Network error contacting FBR", "FBR_NETWORK_ERROR"),
    );

    const err = await captureError(submitInvoiceToFbr(req, String(invoice._id)));

    expect(err.statusCode).toBe(502);
    expect(err.code).toBe("FBR_OUTCOME_UNKNOWN");
    expect(locked.status).toBe("RECONCILIATION_REQUIRED");
    expect(submission.errorCode).toBe("FBR_NETWORK_ERROR");
  });

  it("refuses to resubmit an invoice awaiting reconciliation, without calling FBR", async () => {
    setUpSubmit("RECONCILIATION_REQUIRED");

    const err = await captureError(submitInvoiceToFbr(req, String(invoice._id)));

    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("FBR_RECONCILIATION_REQUIRED");
    expect(Invoice.findOneAndUpdate).not.toHaveBeenCalled();
    expect(FbrSubmission.create).not.toHaveBeenCalled();
    expect(callFbrApi).not.toHaveBeenCalled();
  });

  it("never marks FAILED when a database write fails after FBR accepted the invoice", async () => {
    setUpSubmit();
    (callFbrApi as jest.Mock).mockResolvedValue({
      httpStatus: 200,
      fbrResponseStatus: "Valid",
      fbrReferenceNumber: "7000007DI1747119701593",
      errorCode: null,
      errorMessage: null,
    });
    submission.save.mockRejectedValue(new Error("Mongo write failed"));

    await expect(submitInvoiceToFbr(req, String(invoice._id))).rejects.toThrow("Mongo write failed");

    // Left in SUBMITTING for stale recovery, which will find the recorded FBR reference.
    expect(locked.status).toBe("SUBMITTING");
    expect(locked.set).not.toHaveBeenCalledWith(expect.objectContaining({ status: "FAILED" }));
  });
});

describe("resetInvoiceToDraft", () => {
  it("refuses to reset an invoice awaiting reconciliation", async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(makeInvoice({ status: "RECONCILIATION_REQUIRED" }));

    const err = await captureError(resetInvoiceToDraft(req, new Types.ObjectId().toString()));

    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("INVOICE_NOT_FAILED");
  });
});

describe("reconcileInvoice", () => {
  it("marks SUBMITTED with the FBR reference and records the decision on the attempt", async () => {
    const submissionId = new Types.ObjectId();
    const updated = makeInvoice({ status: "SUBMITTED", fbrLastSubmissionId: submissionId });
    (Invoice.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

    const result = await reconcileInvoice(req, String(updated._id), {
      outcome: "ACCEPTED_BY_FBR",
      fbrReferenceNumber: "7000007DI1747119701593",
      note: "Found in IRIS",
    });

    expect(result).toBe(updated);
    const [filter, update] = (Invoice.findOneAndUpdate as jest.Mock).mock.calls[0];
    expect(filter.status).toBe("RECONCILIATION_REQUIRED");
    expect(String(filter.companyId)).toBe(COMPANY_ID);
    expect(update).toEqual({
      status: "SUBMITTED",
      fbrStatus: "SUBMITTED",
      fbrReferenceNumber: "7000007DI1747119701593",
    });
    const [subFilter, subUpdate] = (FbrSubmission.updateOne as jest.Mock).mock.calls[0];
    expect(subFilter).toEqual({ _id: submissionId });
    expect(subUpdate.reconciliation).toMatchObject({
      outcome: "ACCEPTED_BY_FBR",
      fbrReferenceNumber: "7000007DI1747119701593",
      note: "Found in IRIS",
    });
    expect(String(subUpdate.reconciliation.reconciledBy)).toBe(USER_ID);
    expect(callFbrApi).not.toHaveBeenCalled();
  });

  it("marks FAILED when FBR did not receive it, re-enabling the normal resubmit path", async () => {
    (Invoice.findOneAndUpdate as jest.Mock).mockResolvedValue(makeInvoice({ status: "FAILED" }));

    await reconcileInvoice(req, new Types.ObjectId().toString(), { outcome: "NOT_RECEIVED_BY_FBR" });

    expect((Invoice.findOneAndUpdate as jest.Mock).mock.calls[0][1]).toEqual({
      status: "FAILED",
      fbrStatus: "FAILED",
    });
  });

  it("rejects reconciling an invoice that is not awaiting reconciliation", async () => {
    (Invoice.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
    (Invoice.exists as jest.Mock).mockResolvedValue({ _id: new Types.ObjectId() });

    const err = await captureError(
      reconcileInvoice(req, new Types.ObjectId().toString(), { outcome: "NOT_RECEIVED_BY_FBR" }),
    );

    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("INVOICE_NOT_AWAITING_RECONCILIATION");
    expect(FbrSubmission.updateOne).not.toHaveBeenCalled();
  });

  it("requires the FBR invoice number when reconciling as accepted", () => {
    expect(reconcileInvoiceSchema.safeParse({ outcome: "ACCEPTED_BY_FBR" }).success).toBe(false);
    expect(reconcileInvoiceSchema.safeParse({ outcome: "SOMETHING_ELSE" }).success).toBe(false);
  });
});
