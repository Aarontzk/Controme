# Security

Controme's security model follows the Buildpad RAD architecture:

```text
Browser -> Next.js API proxy -> Buildpad DaaS -> Supabase Postgres + RLS
```

The browser must not call Supabase or DaaS directly.

## RBAC

Minimum roles for the CyberHack rubric:

| Role | Capability |
|---|---|
| `admin` | Manage products/references, users, permissions, and all data. |
| `qc_operator` | Create QC lot records and read product references. |
| `ppic` | Read QC clearance, lots, and production scheduling data. |
| `manager` | Read dashboards, exports, audit evidence, and all QC history. |

Enforcement points:

1. **DaaS permissions** define collection-level and item-level access.
2. **Supabase RLS** provides database defense in depth behind DaaS.
3. **Next.js proxy routes** forward authenticated requests server-side.
4. **Frontend guards** hide unavailable actions for user experience only.

## Audit Trail

DaaS logs item mutations automatically through its activity/audit system. Do not
build a custom audit table in the Next.js app.

QC lot records should also be treated as write-once application records:

- create and read allowed for authorized roles,
- no update/delete UI for submitted lot checks,
- corrections create a new QC lot record,
- product reference changes go to `product_reference_versions`.

## Secrets

- `.env.local` is gitignored.
- Never commit `.mcp.json`, `.codex/config.toml`, `.vscode/mcp.json`, or token
  files.
- Browser-exposed variables must be limited to intended `NEXT_PUBLIC_*` values.
- Service-role keys and platform tokens stay server-side only.

## Transport And CORS

- Production traffic should use HTTPS.
- Browser requests stay same-origin through Next.js API routes.
- DaaS CORS origins must be explicit for local and deployed origins; do not use
  wildcard origins with credentialed fetch.

## Input Validation

- Validate POST/PATCH boundaries with schema validation before adding custom API
  routes.
- Use Buildpad DaaS and Buildpad UI primitives for collection forms/lists.
- Never trust frontend-only role checks for authorization decisions.

## Vision PoC Boundary

`/poc/vision` is intentionally isolated and browser-only:

- no auth gating yet,
- no file upload to storage,
- no lot persistence,
- no DaaS mutation.

When it is wired into the QC capture workflow, image upload and lot creation
must go through the proxy routes described in [API.md](API.md).
