import { Schema, model, type InferSchemaType } from "mongoose";

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    province: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    ntn: { type: String, default: "" },
    strn: { type: String, default: "" },
    businessType: { type: String, default: "" },
    invoicePrefix: { type: String, default: "INV" },
    invoiceNumberSeq: { type: Number, default: 0 },
    fbrConfig: {
      environment: { type: String, enum: ["SANDBOX", "PRODUCTION"], default: "SANDBOX" },
      isConfigured: { type: Boolean, default: false },
      // Which FBR scenario/sale-type family this company's invoices map to — determined by
      // the Business Nature/Sector selected during IRIS registration (see FBR DI API spec
      // §9-10 "Scenarios for Sandbox Testing" / "Applicable Scenarios based on Business
      // Activity"). GOODS -> SN001/SN002, SERVICES -> SN019 (SN018 reserved for FED-in-ST-mode
      // services, not modeled by this MVP). Credentials/tokens are never stored on this
      // document — they live only in server environment variables.
      saleType: { type: String, enum: ["GOODS", "SERVICES"], default: "GOODS" },
    },
  },
  { timestamps: true },
);

export type CompanyDocument = InferSchemaType<typeof companySchema>;
export const Company = model("Company", companySchema);
