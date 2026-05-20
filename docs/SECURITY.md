# Security

## RBAC

Three roles minimum:

| Role | Capability |
|---|---|
| `admin` | Full CRUD + audit log view + user mgmt |
| `operator` | Domain operations (orders, inventory, etc.) |
| `end_user` | Read own data, submit requests |

Enforcement points:

1. **Token** — role embedded as JWT claim / `app_metadata.role`.
2. **Backend** — middleware checks role per endpoint.
3. **Database** — RLS policies (defense in depth).
4. **Frontend** — menu/route guards (UX only, not security).

## Audit Trail

Every mutation logs to `audit_logs` (see [SCHEMA.md](SCHEMA.md)). Append-only via revoked UPDATE/DELETE grants. Admin UI exposes filtered view.

## Secrets

- Never committed. `.env` in `.gitignore`.
- Production secrets in AWS Secrets Manager / Supabase Vault.
- Required-secret validation at app startup — fail fast.

## Transport

- HTTPS enforced (automatic via Vercel / CloudFront).
- HSTS header set.
- CORS allowed origins explicit, no wildcard in prod.

## Input Validation

- Schema-based validation at every endpoint (zod / pydantic).
- Parameterized queries only — no string concat SQL.
- Output sanitized before render (XSS prevention).

## Rate Limiting

_TBA — per-IP + per-user limits on auth + write endpoints._

## Checklist (Day 5 hardening)

See [README.md#enterprise-readiness](../README.md#enterprise-readiness).
