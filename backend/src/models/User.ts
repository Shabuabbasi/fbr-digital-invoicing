import { Schema, model, Types, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "ACCOUNTANT"], required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    // Small profile picture stored as a data URI (no file storage/CDN in this MVP).
    // Capped at upload time — see auth.validator.ts.
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
