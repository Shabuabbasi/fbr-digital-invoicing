import { Schema, model, Types, type InferSchemaType } from "mongoose";

const customerSchema = new Schema(
  {
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    businessName: { type: String, default: "" },
    ntn: { type: String, default: "" },
    strn: { type: String, default: "" },
    cnic: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    province: { type: String, default: "" },
    customerType: { type: String, enum: ["INDIVIDUAL", "BUSINESS"], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

customerSchema.index({ companyId: 1, name: 1 });

export type CustomerDocument = InferSchemaType<typeof customerSchema>;
export const Customer = model("Customer", customerSchema);
