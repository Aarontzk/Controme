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
still enforce product-specific rules in UI/service layers; for example, QC lot
records are intended to be create/read only even though the generic proxy can
forward `PATCH` and `DELETE`.

## Metadata And Permission Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/fields/[collection]` | Field metadata for Buildpad forms/lists. |
| `GET` | `/api/relations` | Relation definitions for relation hooks. |
| `GET` | `/api/permissions/me` | Current user's collection permissions. |

## File And Asset Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/files` | List file metadata. |
| `POST` | `/api/files` | Upload file as `multipart/form-data`. |
| `GET` | `/api/files/[id]` | Get one file's metadata. |
| `PATCH` | `/api/files/[id]` | Update file metadata. |
| `DELETE` | `/api/files/[id]` | Delete file. |
| `GET` | `/api/assets/[id]` | Stream an asset/thumbnail from DaaS. |

## Vision PoC

`/poc/vision` is a page, not an API. The current PoC runs color, texture, and
contamination checks in the browser only. It does not upload images or create
`qc_lots` records yet.

Future KAN-50 wiring should create an authenticated QC capture flow:

1. Upload image through `/api/files`.
2. Evaluate measurement with `lib/domain/evaluateSample`.
3. Create immutable lot record with `POST /api/items/qc_lots`.
4. Rely on DaaS activity logs for mutation audit history.

## Error Codes

| HTTP | Meaning |
|---|---|
| `400` | Validation error or missing required body fields. |
| `401` | Missing/invalid auth session. |
| `403` | DaaS permission denial. |
| `404` | Resource not found. |
| `409` | Conflict or version mismatch. |
| `500` | Proxy/upstream failure. |
