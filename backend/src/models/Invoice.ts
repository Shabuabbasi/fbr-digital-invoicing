import { Schema, model, Types, type InferSchemaType } from "mongoose";

const invoiceItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    hsCode: { type: String, default: "" },
    unit: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0.001 },
    unitPriceMinor: { type: Number, required: true, min: 0 },
    discountMinor: { type: Number, required: true, min: 0, default: 0 },
    taxRateBasisPoints: { type: Number, required: true, min: 0, max: 10000 },
    taxMinor: { type: Number, required: true, min: 0 },
    lineTotalMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const partySnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    ntn: { type: String, default: "" },
    strn: { type: String, default: "" },
    cnic: { type: String, default: "" },
    address: { type: String, default: "" },
    province: { type: String, default: "" },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    customerId: { type: Types.ObjectId, ref: "Customer", required: true },
    sellerSnapshot: { type: partySnapshotSchema, required: true },
    buyerSnapshot: { type: partySnapshotSchema, required: true },
    items: { type: [invoiceItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotalMinor: { type: Number, required: true, min: 0 },
    discountMinor: { type: Number, required: true, min: 0, default: 0 },
    taxMinor: { type: Number, required: true, min: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      // RECONCILIATION_REQUIRED: FBR may or may not have recorded the invoice (timeout, lost
      // response, stale SUBMITTING). Blocks resubmission until an admin reconciles it.
      enum: ["DRAFT", "READY_FOR_SUBMISSION", "SUBMITTING", "SUBMITTED", "FAILED", "RECONCILIATION_REQUIRED"],
      default: "DRAFT",
      index: true,
    },
    fbrStatus: {
      type: String,
      enum: ["NOT_SUBMITTED", "PENDING", "SUBMITTED", "FAILED", "UNKNOWN"],
      default: "NOT_SUBMITTED",
      index: true,
    },
    fbrReferenceNumber: { type: String, default: null },
    // When the current/last SUBMITTING lock was taken — used to detect stale submissions.
    fbrSubmissionStartedAt: { type: Date, default: null },
    fbrLastSubmissionId: { type: Types.ObjectId, ref: "FbrSubmission", default: null },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

invoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ companyId: 1, invoiceDate: 1 });

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema>;
export const Invoice = model("Invoice", invoiceSchema);
