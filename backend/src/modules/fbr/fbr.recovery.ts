import { Invoice } from "../../models/Invoice";
import { FbrSubmission } from "../../models/FbrSubmission";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

// Recovers invoices left in SUBMITTING by a crash/restart mid-submission. Never calls FBR and
// never resubmits. Outcomes, based only on our own FbrSubmission audit records:
// - an attempt for this lock recorded FBR's success         -> SUBMITTED (with that reference)
// - no attempt was created for this lock (FBR never called) -> FAILED (safe to resubmit)
// - otherwise the request may have reached FBR              -> RECONCILIATION_REQUIRED

// Must comfortably exceed the FBR request timeout so an in-flight request is never recovered.
export function effectiveStaleAfterMs(): number {
  return Math.max(env.fbr.submittingStaleAfterMs, env.fbr.timeoutMs + 60 * 1000);
}

export async function recoverStaleSubmittingInvoices(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - effectiveStaleAfterMs());
  const stale = await Invoice.find({
    status: "SUBMITTING",
    $or: [
      { fbrSubmissionStartedAt: { $lt: cutoff } },
      // Invoices locked before fbrSubmissionStartedAt existed.
      { fbrSubmissionStartedAt: null, updatedAt: { $lt: cutoff } },
    ],
  });

  let recovered = 0;
  for (const invoice of stale) {
    const startedAt = invoice.fbrSubmissionStartedAt;
    const attempt = await FbrSubmission.findOne({
      invoiceId: invoice._id,
      ...(startedAt ? { requestedAt: { $gte: startedAt } } : {}),
    }).sort({ attemptNumber: -1 });

    let update: Record<string, unknown>;
    if (attempt?.fbrReferenceNumber) {
      update = {
        status: "SUBMITTED",
        fbrStatus: "SUBMITTED",
        fbrReferenceNumber: attempt.fbrReferenceNumber,
        fbrLastSubmissionId: attempt._id,
      };
    } else if (!attempt && startedAt) {
      update = { status: "FAILED", fbrStatus: "FAILED" };
    } else {
      update = {
        status: "RECONCILIATION_REQUIRED",
        fbrStatus: "UNKNOWN",
        ...(attempt ? { fbrLastSubmissionId: attempt._id } : {}),
      };
    }

    // Conditional on SUBMITTING so a request that finished meanwhile is never overwritten.
    const result = await Invoice.updateOne({ _id: invoice._id, status: "SUBMITTING" }, update);
    if (result.modifiedCount !== 1) continue;
    recovered += 1;

    if (attempt && !attempt.fbrReferenceNumber && !attempt.errorCode) {
      await FbrSubmission.updateOne(
        { _id: attempt._id, errorCode: null },
        {
          errorCode: "FBR_OUTCOME_UNKNOWN",
          errorMessage: "Server stopped before FBR's response was recorded (recovered stale SUBMITTING invoice)",
        },
      );
    }

    logger.warn("Recovered stale SUBMITTING invoice", {
      invoiceId: String(invoice._id),
      newStatus: update.status,
      submissionId: attempt ? String(attempt._id) : null,
    });
  }

  return recovered;
}

export function startStaleSubmissionRecovery(): NodeJS.Timeout {
  const run = () => {
    recoverStaleSubmittingInvoices().catch((err) => {
      logger.error("Stale FBR submission recovery failed", {
        message: err instanceof Error ? err.message : String(err),
      });
    });
  };
  run();
  const timer = setInterval(run, env.fbr.staleCheckIntervalMs);
  timer.unref();
  return timer;
}
