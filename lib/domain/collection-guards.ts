const PROXY_WRITE_LOCKED_COLLECTIONS = new Set(["qc_lots", "product_reference_versions"]);

const PRODUCT_REFERENCE_FIELDS = new Set([
  "ref_l",
  "ref_a",
  "ref_b",
  "tol_l",
  "tol_a",
  "tol_b",
  "delta_e_max",
  "warning_margin",
  "rgb_approx",
  "version",
]);

const WRITE_METHODS = new Set(["POST", "PATCH", "DELETE"]);

export function isWriteLockedCollection(collection: string): boolean {
  return PROXY_WRITE_LOCKED_COLLECTIONS.has(collection);
}

export function containsProductReferenceFields(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  return Object.keys(payload).some((key) => PRODUCT_REFERENCE_FIELDS.has(key));
}

export function shouldBlockCollectionProxyMutation(
  collection: string,
  method: string,
  payload?: unknown
): boolean {
  const normalizedMethod = method.toUpperCase();
  if (isWriteLockedCollection(collection) && WRITE_METHODS.has(normalizedMethod)) {
    return true;
  }

  return (
    collection === "products" &&
    normalizedMethod === "PATCH" &&
    containsProductReferenceFields(payload)
  );
}

export function immutableCollectionMessage(collection: string): string {
  if (collection === "qc_lots") {
    return "QC lot records are immutable; create lots through /api/qc/lots and never update or delete them.";
  }

  if (collection === "product_reference_versions") {
    return "Product reference versions are append-only and may only be written by the DaaS reference update extension.";
  }

  if (collection === "products") {
    return "Product reference fields are versioned; update them through /api/qc/products/[id]/update-reference.";
  }

  return "This collection is write-locked through the generic proxy.";
}
