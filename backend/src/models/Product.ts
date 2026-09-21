import { Schema, model, Types, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    unit: { type: String, required: true, trim: true },
    salePriceMinor: { type: Number, required: true, min: 0 },
    // Basis points, e.g. 1800 = 18%. See docs/DATABASE.md "Money handling rule".
    taxRateBasisPoints: { type: Number, required: true, min: 0, max: 10000, default: 0 },
    // Harmonized System code, required by FBR Digital Invoicing before a product can be
    // submitted (Technical Specification for DI API v1.12 §4.1). Optional at product-creation
    // time so existing catalogs aren't blocked; enforced at FBR submission time instead.
    hsCode: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    stockQty: { type: Number, default: null },
  },
  { timestamps: true },
);

productSchema.index({ companyId: 1, sku: 1 }, { unique: true });

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const Product = model("Product", productSchema);
