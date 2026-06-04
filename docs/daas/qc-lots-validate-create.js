// DaaS extension — qc-lots-validate-create
// Event: qc_lots.items.create | type: filter (blocking) | timeout 3000ms | active
//
// Policy enforcement / input validation. Server-side validation for new QC lots —
// defense-in-depth behind the Zod check in app/api/qc/lots/route.ts. No
// structurally invalid measurement can be persisted via any write path. Returns
// the (unmodified) payload when valid; throwing cancels the create.
const items = Array.isArray(payload) ? payload : [payload];

for (const data of items) {
  const d = data || {};
  const errors = [];

  if (!d.product_id) errors.push('product_id is required');

  for (const ch of ['l_value', 'a_value', 'b_value']) {
    const v = d[ch];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      errors.push(ch + ' must be a finite number');
    }
  }

  if (typeof d.delta_e !== 'number' || !Number.isFinite(d.delta_e) || d.delta_e < 0) {
    errors.push('delta_e must be a non-negative number');
  }

  if (d.status !== 'pass' && d.status !== 'reject') {
    errors.push("status must be 'pass' or 'reject'");
  }

  if (d.status === 'reject' && !d.reject_reason) {
    errors.push('a reject lot must include reject_reason');
  }

  if (errors.length) {
    throw new Error('qc_lots validation failed: ' + errors.join('; '));
  }
}

return payload;
