# Data Model — Controme

Computer-vision colour QC for Sima Arome. Data lives in **Buildpad DaaS collections** (REST
over Supabase Postgres), consumed by the Next.js app through `/api/items/*` proxy routes —
never direct browser→Supabase.

> **Audit trail (rubric + FR-02):** DaaS logs **every** item mutation automatically
> (`daas_activity` table + `GET /api/activity`). We do **not** build a custom audit table.
> QC lot records are additionally write-once at the application level (no update/delete
> exposed) so a lot's verdict is immutable.

## Collections

### `products` — colour-QC reference (FR-03)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | string | e.g. "Spray-Dried Ginger Powder" |
| `sku` | string | optional internal code |
| `category` | enum | `essential_oil` / `aromatic_chemical` / `natural_extract` / `powder` |
| `ref_l` | float | reference L\* |
| `ref_a` | float | reference a\* |
| `ref_b` | float | reference b\* |
| `tol_l` | float | ± tolerance L\* |
| `tol_a` | float | ± tolerance a\* |
| `tol_b` | float | ± tolerance b\* |
| `delta_e_max` | float | reject when measured ΔE exceeds this |
| `warning_margin` | float | near-limit warning band fraction; default `0.10` |
| `rgb_approx` | string | `#RRGGBB` for UI preview only |
| `active` | boolean | reference in use |
| `workflow_instance` | uuid m2o -> `daas_wf_instance` | DaaS workflow instance for reference approval |
| `workflow_state` | string | current Product Reference Approval state |

Reference edits are versioned (FR-03) through the DaaS
`qc-reference-autoversion` action extension -> `product_reference_versions`.
The admin product page derives `ref_l/a/b` from a reference photo or RGB picker, then writes
the normalized reference values through the versioned update route.
Reference lifecycle is tracked by the DaaS `Product Reference Approval` workflow; see
[DAAS_WORKFLOWS.md](DAAS_WORKFLOWS.md).

### `qc_lots` — immutable QC check records (FR-02, PRD §4.3)

Field names below match the live DaaS collection.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `product_id` | m2o → `products` | indexed |
| `checked_at` | timestamptz | check time (indexed desc) |
| `l_value` | float | measured L\* |
| `a_value` | float | measured a\* |
| `b_value` | float | measured b\* |
| `delta_e` | float | computed ΔE vs reference |
| `status` | enum | final `pass` / `reject` (indexed) — reject if any lane fails |
| `warning_flag` | boolean | true when passing Delta E is >90% and <=100% of `delta_e_max` |
| `qc_stage` | enum | `incoming` / `finish` traceability stage |
| `reference_version` | integer | product reference version used for this measurement |
| `workflow_instance` | uuid m2o -> `daas_wf_instance` | DaaS workflow instance for lot disposition |
| `workflow_state` | string | current QC Lot Disposition state |
| `channel_flags` | json | channels outside tolerance (explanatory) |
| `contaminant_ratio` | float | foreign-object pixel ratio in ROI (contamination lane) |
| `brightness_stddev` | float | powder brightness std dev (consistency lane) |
| `texture_contrast` | float | adjacent-pixel local contrast (consistency lane) |
| `reject_reason` | string | failed lane(s): `color` / `contamination` / `consistency` |
| `photo` | file → `daas_files` | DaaS Files reference |
| `operator_id` | m2o → `daas_users` | who ran the check |

**Immutability:** create + read only; no update/delete in the UI or proxy (enforced via RBAC).
Corrections create a new lot. **ΔE/status are recomputed server-side** in
[`app/api/qc/lots/route.ts`](../app/api/qc/lots/route.ts) from the uploaded photo (sharp →
[`lib/vision/image-pipeline.server.ts`](../lib/vision/image-pipeline.server.ts) →
[`lib/domain/evaluateSample`](../lib/domain/qc.ts)) — the browser preview is advisory and is
never trusted for the stored verdict.

### `product_reference_versions` — reference history (FR-03)

`id`, `product_id` (m2o), `ref_l/a/b`, `tol_l/a/b`, `delta_e_max`, `user_created`,
`date_created`, `reason`. One row per reference change, append-only.

Created by the DaaS `qc-reference-autoversion` action hook on
`products.items.update` whenever reference Lab, tolerance, or threshold fields
change. The snapshot code is stored in
[`docs/daas/qc-reference-autoversion.js`](daas/qc-reference-autoversion.js).

### `qc_notifications` - QC alerts (FR-04)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `lot_id` | m2o -> `qc_lots` | lot that triggered the notification |
| `product_id` | m2o -> `products` | product for filtering/dashboard display |
| `level` | enum/string | `alert` for reject, `warning` for warning-band pass |
| `status` | enum/string | copied from `qc_lots.status` |
| `delta_e` | float | copied from `qc_lots.delta_e` |
| `message` | string | generated dashboard message |
| `read` | boolean | false until acknowledged |
| `date_created` | datetime | DaaS special field |
| `workflow_instance` | uuid m2o -> `daas_wf_instance` | DaaS workflow instance for alert resolution |
| `workflow_state` | string | current QC Alert Resolution state |

Rows are created by the DaaS `qc-reject-notify` action hook on
`qc_lots.items.create`; the client should read them, not create them directly.
The snapshot code is stored in
[`docs/daas/qc-reject-notify.js`](daas/qc-reject-notify.js).

### Users & roles (RBAC — 4 roles)

DaaS Permission system (Policy → Role → User). Roles:

| Role | Capability |
|---|---|
| `admin` | manage products/references, users, all data |
| `qc_operator` | create QC lots, read products; **no** product-reference edits |
| `ppic` | read lots + clearance dashboard; no QC create |
| `manager` | read all + exports (COA / buyer audit); dashboards |

Enforced backend (DaaS permissions) **and** frontend (route/UI gating). See
[SECURITY.md](SECURITY.md).

## Seed (PRD §4.3 — Farel / DaaS MCP)

Two demo products with reference values in
[`lib/domain/reference-products.ts`](../lib/domain/reference-products.ts):

- **Spray-Dried Ginger Powder** — L\* 69.52±4.0, a\* +9.34±2.0, b\* +37.40±3.5, ΔE max 5.0
- **Dragon Fruit Powder** — L\* 45.0±3.5, a\* +38.6±4.0, b\* −8.3±2.5, ΔE max 4.5

Seed ≥2 `pass` + 1 `reject` lot per product. Dragon Fruit is the flagship "flagged lot" demo
(oxidation shifts colour dramatically).

## QC logic (shared)

ΔE (CIE76) + pass/reject + channel-flag evaluation live in
[`lib/domain/`](../lib/domain/) (`colorimetry.ts`, `qc.ts`) and are unit-tested
(`qc.test.ts`). Reused by the capture flow and any server-side recompute.

## Indexes

`qc_lots(product_id)`, `qc_lots(checked_at desc)`, `qc_lots(status)` — for the PPIC clearance
list and Manager dashboards.

## RLS

DaaS-managed per the Permission system; see [SECURITY.md](SECURITY.md).
