# API Contract

Controme exposes same-origin Next.js API routes that proxy to Supabase Auth and
Buildpad DaaS. Client code should call these routes, not the upstream services
directly.

## Conventions

- Browser base URL: same origin, for example `http://localhost:3000`.
- DaaS upstream: `NEXT_PUBLIC_BUILDPAD_DAAS_URL` / server-side DaaS env.
- Auth: Supabase session cookie plus proxied `Authorization` header when needed.
- Upstream response shape follows Buildpad DaaS/Supabase responses:

```json
{
  "data": {},
  "errors": []
}
```

For DaaS collection list responses, pagination/filter metadata is forwarded from
the DaaS response unchanged.

## Auth Routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Login with email/password through Supabase Auth. |
| `GET` | `/api/auth/user` | Return current user profile; tries DaaS `/api/users/me`, falls back to Supabase user. |
| `GET` | `/api/auth/callback` | Handle auth callback and session exchange. |
| `POST` | `/api/auth/logout` | Clear Supabase session. |

`POST /api/auth/login` body:

```json
{
  "email": "operator@example.com",
  "password": "********"
}
```

## DaaS Collection Routes

| Method | Route | Upstream |
|---|---|---|
| `GET` | `/api/items/[collection]` | `GET /api/items/{collection}` |
| `POST` | `/api/items/[collection]` | `POST /api/items/{collection}` |
| `GET` | `/api/items/[collection]/[id]` | `GET /api/items/{collection}/{id}` |
| `PATCH` | `/api/items/[collection]/[id]` | `PATCH /api/items/{collection}/{id}` |
| `DELETE` | `/api/items/[collection]/[id]` | `DELETE /api/items/{collection}/{id}` |

Query strings and request bodies are forwarded to DaaS. Feature screens must
still enforce product-specific rules in UI/service layers. The generic proxy
also blocks direct writes to immutable collections:

- `qc_lots`: `POST`, `PATCH`, and `DELETE` are rejected here. Create records
  through `POST /api/qc/lots` so the server recomputes QC results from the photo.
- `product_reference_versions`: direct writes are rejected here. Reference
  history is appended by the DaaS `qc-reference-autoversion` extension when
  product reference fields change through
  `PATCH /api/qc/products/[id]/update-reference`.
- `qc_notifications`: clients read notification rows; creation is handled by
  the DaaS `qc-reject-notify` extension after `qc_lots` creates.
- `products`: generic `PATCH` requests that include reference fields (`ref_l`,
  `ref_a`, `ref_b`, tolerances, thresholds, `rgb_approx`, or `version`) are
  rejected so reference history cannot be bypassed. Product metadata such as
  `name`, `sku`, `category`, and `active` can still use the generic proxy.

## Metadata And Permission Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/fields/[collection]` | Field metadata for Buildpad forms/lists. |
| `GET` | `/api/relations` | Relation definitions for relation hooks. |
| `GET` | `/api/permissions/me` | Current user's collection permissions. |
| `GET` | `/api/health` | Runtime liveness check for deployment smoke tests. |

## File And Asset Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/files` | List file metadata. |
| `POST` | `/api/files` | Upload file as `multipart/form-data`. |
| `GET` | `/api/files/[id]` | Get one file's metadata. |
| `PATCH` | `/api/files/[id]` | Update file metadata. |
| `DELETE` | `/api/files/[id]` | Delete file. |
| `GET` | `/api/assets/[id]` | Stream an asset/thumbnail from DaaS. |

## QC Routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/qc/lots` | Authenticated lot capture; recomputes QC metrics server-side, uploads photo, creates immutable `qc_lots`. |
| `GET` | `/api/qc/export` | CSV COA/history export for manager/admin demo flows. |
| `GET` | `/api/qc/schema-readiness` | Checks whether live DaaS schema has the fields required by the backend code. |
| `GET` | `/api/qc/demo-readiness` | Checks whether seeded demo lots cover pass/reject/warning and incoming/finish stages. |
| `PATCH` | `/api/qc/products/[id]/update-reference` | Admin reference update that patches `products`; DaaS appends `product_reference_versions` via extension. |

`POST /api/qc/lots` accepts `multipart/form-data`:

| Field | Type | Notes |
|---|---|---|
| `productId` | UUID string | Product reference to compare against. |
| `qcStage` | `incoming` / `finish` | Optional; defaults to `incoming`. |
| `photo` | JPEG/PNG/WebP file | Validated before image processing. |

The stored lot includes server-authoritative `warning_flag`, `qc_stage`, and
`reference_version` values. Browser preview metrics are advisory only.

`GET /api/qc/export` supports optional filters: `lot_id`, `product_id`, `status`,
and `limit` (defaults to `500`). The response is `text/csv` with
`Content-Disposition: attachment`.

`GET /api/qc/schema-readiness` should return `ready: true` before deployment. It currently
requires `products.version` and `qc_lots.warning_flag|qc_stage|reference_version|lot_code`.

`GET /api/qc/demo-readiness` should return `data.ready: true` before demo recording. It checks
for seeded pass/reject lots, one warning lot, and both `incoming` and `finish` QC stages.

`PATCH /api/qc/products/[id]/update-reference` body:

```json
{
  "ref_l": 69.52,
  "ref_a": 9.34,
  "ref_b": 37.4,
  "tol_l": 4,
  "tol_a": 2,
  "tol_b": 3.5,
  "delta_e_max": 5,
  "rgb_approx": "#C99A45",
  "reason": "Recalibrated against retained sample"
}
```

`/poc/vision` remains a browser-only experiment page for deterministic fixture testing.

## Audit Log Route

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/activity` | Proxy to DaaS immutable audit log. Restricted to admin/manager. |

`GET /api/activity` query params:

| Param | Default | Notes |
|---|---|---|
| `limit` | `100` | Max rows returned. |
| `offset` | `0` | Pagination offset. |
| `sort` | `-timestamp` | DaaS sort expression. |
| `collection` | — | Filter by collection name, e.g. `qc_lots`. |
| `filter` | — | Raw DaaS JSON filter object. |

Returns the DaaS activity log response unchanged. Each row contains: `id`, `action` (create/update/delete), `collection`, `item` (record id), `user` (user id), `timestamp`, `ip`, `user_agent`.

## Error Codes

| HTTP | Meaning |
|---|---|
| `400` | Validation error or missing required body fields. |
| `401` | Missing/invalid auth session. |
| `403` | DaaS permission denial. |
| `404` | Resource not found. |
| `409` | Conflict or version mismatch. |
| `500` | Proxy/upstream failure. |
