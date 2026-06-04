// DaaS append-only guards — six FILTER (blocking) extensions, timeout 3000ms, active.
//
// Each guard is a one-line filter on a specific collection+operation event that
// throws to cancel the mutation. They enforce immutability at the DaaS layer
// (defense-in-depth behind the Next proxy guard in lib/domain/collection-guards.ts).
//
// Safe because: the QC create flow (app/api/qc/lots/route.ts) is a single POST and
// never updates a lot; product_reference_versions is insert-only via
// qc-reference-autoversion; audit_archive is inserted by qc-audit-archive through
// the supabase client (which bypasses these item filters).
//
// These guard the items API / MCP surface. Direct supabase/service-role writes
// (crons, admin tooling) are intentionally not blocked.

// ── qc_lots ───────────────────────────────────────────────────────────────────
// event: qc_lots.items.update
throw new Error('qc_lots is append-only: UPDATE is blocked. Create a new lot to correct a measurement.');
// event: qc_lots.items.delete
throw new Error('qc_lots is append-only: DELETE is blocked. QC measurements are permanent for audit.');

// ── product_reference_versions (FR-03 reference history) ───────────────────────
// event: product_reference_versions.items.update
throw new Error('product_reference_versions is append-only (FR-03 reference history): UPDATE is blocked.');
// event: product_reference_versions.items.delete
throw new Error('product_reference_versions is append-only (FR-03 reference history): DELETE is blocked.');

// ── audit_archive (off-table audit copy) ───────────────────────────────────────
// event: audit_archive.items.update
throw new Error('audit_archive is append-only: UPDATE is blocked.');
// event: audit_archive.items.delete
throw new Error('audit_archive is append-only: DELETE is blocked.');
