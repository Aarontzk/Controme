import { describe, expect, it } from "vitest";

import {
  immutableCollectionMessage,
  isWriteLockedCollection,
  shouldBlockCollectionProxyMutation,
} from "./collection-guards";

describe("collection proxy guards", () => {
  it("blocks generic proxy writes for immutable QC records", () => {
    expect(shouldBlockCollectionProxyMutation("qc_lots", "POST")).toBe(true);
    expect(shouldBlockCollectionProxyMutation("qc_lots", "PATCH")).toBe(true);
    expect(shouldBlockCollectionProxyMutation("qc_lots", "DELETE")).toBe(true);
  });

  it("allows reads for write-locked collections", () => {
    expect(shouldBlockCollectionProxyMutation("qc_lots", "GET")).toBe(false);
    expect(shouldBlockCollectionProxyMutation("product_reference_versions", "GET")).toBe(false);
  });

  it("does not block unrelated collection writes", () => {
    expect(isWriteLockedCollection("products")).toBe(false);
    expect(shouldBlockCollectionProxyMutation("products", "PATCH")).toBe(false);
  });

  it("returns an operator-facing message for locked collections", () => {
    expect(immutableCollectionMessage("qc_lots")).toContain("/api/qc/lots");
    expect(immutableCollectionMessage("product_reference_versions")).toContain("append-only");
  });
});
