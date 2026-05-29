/**
 * Boundary validation for the QC capture upload. Runs in the API route before any image
 * decoding so malformed or oversized requests are rejected cheaply.
 */

import { z } from "zod";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const qcLotUploadSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  qcStage: z.enum(["incoming", "finish"]).default("incoming"),
  lotCode: z.string().trim().max(80).optional(),
  note: z.string().trim().max(500).optional(),
});

export type QcLotUploadInput = z.infer<typeof qcLotUploadSchema>;

export type PhotoValidation =
  | { ok: true }
  | { ok: false; error: string };

/** Validate the uploaded photo's type and size at the system boundary. */
export function validatePhoto(
  file: { type: string; size: number } | null | undefined
): PhotoValidation {
  if (!file) {
    return { ok: false, error: "A photo file is required." };
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return {
      ok: false,
      error: `Unsupported image type "${file.type}". Use JPEG, PNG, or WebP.`,
    };
  }
  if (file.size <= 0) {
    return { ok: false, error: "The photo file is empty." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return {
      ok: false,
      error: `Photo exceeds ${Math.round(MAX_PHOTO_BYTES / (1024 * 1024))}MB limit.`,
    };
  }
  return { ok: true };
}
