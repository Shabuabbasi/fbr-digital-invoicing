import { Types } from "mongoose";
import { Invoice } from "../../models/Invoice";
import { FbrSubmission } from "../../models/FbrSubmission";
import { env } from "../../config/env";
import { submitInvoice as callFbrApi } from "./fbr.client";
import { effectiveStaleAfterMs, recoverStaleSubmittingInvoices } from "./fbr.recovery";

// Models and the FBR HTTP client are mocked: no database and never any real FBR request.
jest.mock("../../models/Invoice", () => ({ Invoice: { find: jest.fn(), updateOne: jest.fn() } }));
jest.mock("../../models/FbrSubmission", () => ({
  FbrSubmission: { findOne: jest.fn(), updateOne: jest.fn() },
}));
jest.mock("./fbr.client", () => ({ submitInvoice: jest.fn() }));
jest.mock("../../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const NOW = new Date("2026-09-25T12:00:00.000Z");
const original = { ...env.fbr };

function staleInvoice(startedAt: Date | null = new Date(NOW.getTime() - 10 * 60 * 1000)) {
  return { _id: new Types.ObjectId(), status: "SUBMITTING", fbrSubmissionStartedAt: startedAt };
}

function mockLatestAttempt(attempt: Record<string, unknown> | null) {
  (FbrSubmission.findOne as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(attempt) });
}

function invoiceUpdate() {
  return (Invoice.updateOne as jest.Mock).mock.calls[0];
}

beforeEach(() => {
  jest.clearAllMocks();
  env.fbr.timeoutMs = 15000;
  env.fbr.submittingStaleAfterMs = 5 * 60 * 1000;
  (Invoice.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
});

afterAll(() => {
  Object.assign(env.fbr, original);
});

describe("recoverStaleSubmittingInvoices", () => {
  it("only picks up SUBMITTING invoices older than the configured threshold", async () => {
    (Invoice.find as jest.Mock).mockResolvedValue([]);

    await recoverStaleSubmittingInvoices(NOW);

    const filter = (Invoice.find as jest.Mock).mock.calls[0][0];
    expect(filter.status).toBe("SUBMITTING");
    const cutoff = new Date(NOW.getTime() - 5 * 60 * 1000);
    expect(filter.$or[0].fbrSubmissionStartedAt.$lt).toEqual(cutoff);
    expect(filter.$or[1].updatedAt.$lt).toEqual(cutoff);
  });

  it("never uses a threshold shorter than the FBR timeout plus a margin", () => {
    env.fbr.submittingStaleAfterMs = 1000;
    env.fbr.timeoutMs = 30000;
    expect(effectiveStaleAfterMs()).toBe(90000);
  });

  it("moves an attempt with no recorded FBR response to RECONCILIATION_REQUIRED without resubmitting", async () => {
    const invoice = staleInvoice();
    const attempt = { _id: new Types.ObjectId(), fbrReferenceNumber: null, errorCode: null };
    (Invoice.find as jest.Mock).mockResolvedValue([invoice]);
    mockLatestAttempt(attempt);

    const recovered = await recoverStaleSubmittingInvoices(NOW);

    expect(recovered).toBe(1);
    const [filter, update] = invoiceUpdate();
    expect(filter).toEqual({ _id: invoice._id, status: "SUBMITTING" });
    expect(update).toEqual({
      status: "RECONCILIATION_REQUIRED",
      fbrStatus: "UNKNOWN",
      fbrLastSubmissionId: attempt._id,
    });
    // Only this lock's attempts are considered.
    expect((FbrSubmission.findOne as jest.Mock).mock.calls[0][0]).toEqual({
      invoiceId: invoice._id,
      requestedAt: { $gte: invoice.fbrSubmissionStartedAt },
    });
    // The audit record is preserved and annotated, not deleted.
    expect(FbrSubmission.updateOne).toHaveBeenCalledWith(
      { _id: attempt._id, errorCode: null },
      expect.objectContaining({ errorCode: "FBR_OUTCOME_UNKNOWN" }),
    );
    expect(callFbrApi).not.toHaveBeenCalled();
  });

  it("completes the invoice as SUBMITTED when our audit record already holds FBR's success", async () => {
    const invoice = staleInvoice();
    const attempt = { _id: new Types.ObjectId(), fbrReferenceNumber: "7000007DI1747119701593", errorCode: null };
    (Invoice.find as jest.Mock).mockResolvedValue([invoice]);
    mockLatestAttempt(attempt);

    await recoverStaleSubmittingInvoices(NOW);

    expect(invoiceUpdate()[1]).toEqual({
      status: "SUBMITTED",
      fbrStatus: "SUBMITTED",
      fbrReferenceNumber: "7000007DI1747119701593",
      fbrLastSubmissionId: attempt._id,
    });
    expect(FbrSubmission.updateOne).not.toHaveBeenCalled();
  });

  it("marks FAILED when no attempt was ever created for the lock (FBR was never called)", async () => {
    (Invoice.find as jest.Mock).mockResolvedValue([staleInvoice()]);
    mockLatestAttempt(null);

    await recoverStaleSubmittingInvoices(NOW);

    expect(invoiceUpdate()[1]).toEqual({ status: "FAILED", fbrStatus: "FAILED" });
  });

  it("is conservative for legacy invoices with no lock timestamp", async () => {
    const invoice = staleInvoice(null);
    (Invoice.find as jest.Mock).mockResolvedValue([invoice]);
    mockLatestAttempt(null);

    await recoverStaleSubmittingInvoices(NOW);

    expect((FbrSubmission.findOne as jest.Mock).mock.calls[0][0]).toEqual({ invoiceId: invoice._id });
    expect(invoiceUpdate()[1]).toEqual({ status: "RECONCILIATION_REQUIRED", fbrStatus: "UNKNOWN" });
  });

  it("does nothing if the submission finished before recovery could update it", async () => {
    (Invoice.find as jest.Mock).mockResolvedValue([staleInvoice()]);
    mockLatestAttempt({ _id: new Types.ObjectId(), fbrReferenceNumber: null, errorCode: null });
    (Invoice.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 0 });

    const recovered = await recoverStaleSubmittingInvoices(NOW);

    expect(recovered).toBe(0);
    expect(FbrSubmission.updateOne).not.toHaveBeenCalled();
  });
});
