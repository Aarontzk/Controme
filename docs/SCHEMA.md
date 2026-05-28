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
| `rgb_approx` | string | `#RRGGBB` for UI preview only |
| `active` | boolean | reference in use |

Reference edits are versioned (FR-03) → `product_reference_versions`.

### `qc_lots` — immutable QC check records (FR-02, PRD §4.3)

| Field | Type | Notes |
|---|---|---|
| `id` / `lot_id` | uuid PK | |
| `product_id` | m2o → `products` | |
| `checked_at` | timestamptz | check time (indexed) |
| `l_value` | float | measured L\* |
| `a_value` | float | measured a\* |
| `b_value` | float | measured b\* |
| `delta_e` | float | computed ΔE vs reference |
| `status` | enum | `pass` / `reject` |
| `channel_flags` | jsonb | channels outside tolerance (explanatory) |
| `photo_url` | string | DaaS Files API reference |
| `operator_id` | m2o → user | who/what ran the check |

**Immutability:** create + read only; no update/delete in the UI or proxy. Corrections create
a new lot. ΔE/status are computed server-side (or in `lib/domain`) — never client-supplied.

### `product_reference_versions` — reference history (FR-03)

`id`, `product_id` (m2o), `ref_l/a/b`, `tol_l/a/b`, `delta_e_max`, `changed_by`, `changed_at`,
`reason`. One row per reference change, append-only.

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

- **Spray-Dried Ginger Powder** — L\* 68.5±4.0, a\* +7.2±2.0, b\* +32.4±3.5, ΔE max 5.0
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
