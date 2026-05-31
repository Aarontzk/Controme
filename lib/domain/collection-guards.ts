const PROXY_WRITE_LOCKED_COLLECTIONS = new Set(["qc_lots", "product_reference_versions"]);

const WRITE_METHODS = new Set(["POST", "PATCH", "DELETE"]);

export function isWriteLockedCollection(collection: string): boolean {
  return PROXY_WRITE_LOCKED_COLLECTIONS.has(collection);
}

export function shouldBlockCollectionProxyMutation(collection: string, method: string): boolean {
  return isWriteLockedCollection(collection) && WRITE_METHODS.has(method.toUpperCase());
}

export function immutableCollectionMessage(collection: string): string {
  if (collection === "qc_lots") {
    return "QC lot records are immutable; create lots through /api/qc/lots and never update or delete them.";
  }

  if (collection === "product_reference_versions") {
    return "Product reference versions are append-only and may only be written by the DaaS reference update extension.";
  }

  return "This collection is write-locked through the generic proxy.";
}
