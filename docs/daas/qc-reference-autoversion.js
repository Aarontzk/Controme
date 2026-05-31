// DaaS runtime extension - ACTION hook
// Name:  qc-reference-autoversion
// Event: products.items.update
// FR-03: append-only reference history. Whenever a product's CIELAB reference,
// per-channel tolerance, or Delta E threshold changes, snapshot the new values
// into product_reference_versions so old qc_lots keep pointing at the reference
// that was in force when they were measured.
//
// Recreate via `mcp_daas_extensions create` (type: action, status: active) or
// the DaaS admin UI. Sandbox note: services.items(...) returns a Promise; await it.

const svc = (typeof services !== "undefined") ? services : context.services;
const payload = (meta && meta.payload) || {};
const refFields = ["ref_l", "ref_a", "ref_b", "tol_l", "tol_a", "tol_b", "delta_e_max"];
const changed = refFields.some((f) => Object.prototype.hasOwnProperty.call(payload, f));
if (!changed) {
  return;
}

const keys = (meta && meta.keys) || (meta && meta.key ? [meta.key] : []);
const products = await svc.items("products", { elevated: true });
const versions = await svc.items("product_reference_versions", { elevated: true });

for (const key of keys) {
  const p = await products.readOne(key);
  const reason = p.version != null
    ? "Reference updated to version " + p.version
    : "Reference updated";
  await versions.createOne({
    product_id: key,
    ref_l: p.ref_l,
    ref_a: p.ref_a,
    ref_b: p.ref_b,
    tol_l: p.tol_l,
    tol_a: p.tol_a,
    tol_b: p.tol_b,
    delta_e_max: p.delta_e_max,
    reason,
  });
  console.log("autoversion: snapshot for product " + key);
}
