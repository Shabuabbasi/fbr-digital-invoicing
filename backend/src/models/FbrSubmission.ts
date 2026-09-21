import { Schema, model, Types, type InferSchemaType } from "mongoose";

const fbrSubmissionSchema = new Schema(
  {
    invoiceId: { type: Types.ObjectId, ref: "Invoice", required: true, index: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    environment: { type: String, enum: ["SANDBOX", "PRODUCTION"], required: true },
    attemptNumber: { type: Number, required: true },
    // Our own correlation id — used as an idempotency key and for support/debugging.
    // Never stores FBR credentials — see docs/FBR-INTEGRATION.md.
    requestId: { type: String, required: true, unique: true },
    requestPayload: { type: Schema.Types.Mixed, default: null },
    requestedAt: { type: Date, required: true },
    httpStatus: { type: Number, default: null },
    fbrResponseStatus: { type: String, default: null },
    fbrReferenceNumber: { type: String, default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type FbrSubmissionDocument = InferSchemaType<typeof fbrSubmissionSchema>;
export const FbrSubmission = model("FbrSubmission", fbrSubmissionSchema);
