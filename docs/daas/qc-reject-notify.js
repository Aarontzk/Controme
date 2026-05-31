// DaaS runtime extension - ACTION hook
// Name:  qc-reject-notify
// Event: qc_lots.items.create
// FR-04: when a new QC lot is created, raise an alert if it is REJECT, or a
// warning if it passed inside the warning band. Writes to qc_notifications,
// which the dashboards read (manager/PPIC). Replaces the client-only toast.
//
// Recreate via `mcp_daas_extensions create` (type: action, status: active).
// Sandbox note: services.items(...) returns a Promise; await it.

const svc = (typeof services !== "undefined") ? services : context.services;
const keys = (meta && meta.keys) || (meta && meta.key ? [meta.key] : []);
const lots = await svc.items("qc_lots", { elevated: true });
const notifs = await svc.items("qc_notifications", { elevated: true });

for (const key of keys) {
  const lot = await lots.readOne(key);
  const isReject = lot.status === "reject";
  const isWarning = lot.warning_flag === true;
  if (!isReject && !isWarning) {
    continue;
  }

  const productId =
    typeof lot.product_id === "string"
      ? lot.product_id
      : (lot.product_id && lot.product_id.id) || null;
  const label = lot.lot_code || key;
  const deltaE = lot.delta_e != null ? lot.delta_e : "?";

  await notifs.createOne({
    lot_id: key,
    product_id: productId,
    level: isReject ? "alert" : "warning",
    status: lot.status,
    delta_e: lot.delta_e,
    message: isReject
      ? "Lot " + label + " REJECTED (Delta E " + deltaE + ")."
      : "Lot " + label + " passed in warning band (Delta E " + deltaE + ").",
    read: false,
  });
  console.log("qc-reject-notify: " + (isReject ? "alert" : "warning") + " for lot " + key);
}
