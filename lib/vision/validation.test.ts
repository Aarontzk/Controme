import { describe, expect, it } from "vitest";

import {
  MAX_PHOTO_BYTES,
  qcLotUploadSchema,
  validatePhoto,
} from "./validation";

describe("qcLotUploadSchema", () => {
  it("accepts a UUID productId", () => {
    const result = qcLotUploadSchema.safeParse({
      productId: "c4c1ccb9-47f9-4217-a992-4e8fd366f890",
    });
    expect(result.success).toBe(true);
  });

  it("defaults qcStage to incoming", () => {
    const result = qcLotUploadSchema.parse({
      productId: "c4c1ccb9-47f9-4217-a992-4e8fd366f890",
    });
    expect(result.qcStage).toBe("incoming");
  });

  it("accepts finish qcStage", () => {
    const result = qcLotUploadSchema.safeParse({
      productId: "c4c1ccb9-47f9-4217-a992-4e8fd366f890",
      qcStage: "finish",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID productId", () => {
    const result = qcLotUploadSchema.safeParse({ productId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown qcStage", () => {
    const result = qcLotUploadSchema.safeParse({
      productId: "c4c1ccb9-47f9-4217-a992-4e8fd366f890",
      qcStage: "dispatch",
    });
    expect(result.success).toBe(false);
  });
});

describe("validatePhoto", () => {
  it("accepts a reasonable JPEG", () => {
    expect(validatePhoto({ type: "image/jpeg", size: 1024 })).toEqual({ ok: true });
  });

  it("rejects a missing file", () => {
    expect(validatePhoto(null).ok).toBe(false);
  });

  it("rejects an unsupported type", () => {
    const result = validatePhoto({ type: "application/pdf", size: 1024 });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(validatePhoto({ type: "image/png", size: 0 }).ok).toBe(false);
  });

  it("rejects an oversized file", () => {
    const result = validatePhoto({ type: "image/png", size: MAX_PHOTO_BYTES + 1 });
    expect(result.ok).toBe(false);
  });
});
