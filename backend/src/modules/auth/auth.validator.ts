import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Profile picture, stored as a data URI (no file storage/CDN in this MVP). Capped at ~2MB
// raw image (base64 is ~4/3 the size) so a single document never gets unreasonably large.
export const updateAvatarSchema = z.object({
  avatarUrl: z
    .string()
    .max(2_800_000, "Image is too large — please use a smaller picture")
    .refine((v) => v === "" || v.startsWith("data:image/"), "Must be an image data URL"),
});
