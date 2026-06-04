# Enterprise Readiness Scorecard — Controme (Tim Retas Siber Imut)

How the Controme QC platform satisfies the CyberHack 2026 enterprise-readiness rubric.
Most controls map directly to **DaaS built-ins** (audit, RBAC, scope, RLS, crons, runtime
extensions) rather than hand-built code. DaaS-side objects (crons, filter extensions,
collections, permissions) are backend config provisioned via MCP and snapshotted under
[`docs/daas/`](daas/); the Next.js app is the frontend + server-side proxy.

Legend: ✅ implemented · ➕ defence-in-depth · 📄 documented / infra-provided

| # | Component | Status | Evidence |
|---|---|---|---|
| 1 | Immutable audit trail | ✅ | below |
| 2 | RBAC (≥3 roles, front + back) | ✅ | below |
| 3 | Policy enforcement (RLS) | ✅ | below |
| 4 | Security | ✅📄 | below |
| 5 | Scalability | ✅📄 | below |
| 6 | Observability | ✅ | below |
| 7 | Clean docs | ✅ | below |
| 8 | Deployability | ✅ | below |

---

## 1. Immutable audit trail

- **DaaS activity log** records every mutation automatically (user, IP, timestamp,
  before/after) — no hand-built audit trail.
- **Append-only enforcement** at two layers:
  - Next proxy guard — `lib/domain/collection-guards.ts` blocks POST/PATCH/DELETE on
    `qc_lots` and `product_reference_versions` through the generic `/api/items/*` proxy.
  - ➕ DaaS filter hooks — six guards reject UPDATE/DELETE on `qc_lots`,
    `product_reference_versions`, and `audit_archive` at the backend
    ([`docs/daas/append-only-guards.js`](daas/append-only-guards.js)). Verified: a direct
    `items.update` on a lot returns `"qc_lots is append-only: UPDATE is blocked."`
- **Off-table archival** — `qc-audit-archive` copies each day's activity into
  `audit_archive` *before* the 90-day `activity-housekeeping` purge, so history is never
  lost ([`docs/daas/qc-audit-archive.js`](daas/qc-audit-archive.js)).
- **Detective control** — `qc-integrity-watch` hourly scans the activity log for tamper
  signals (delete/update on append-only tables, delete bursts) and raises an alert.

## 2. RBAC (≥3 roles, front + back)

- Three domain roles + policies: **qc_operator**, **ppic**, **manager** (plus
  Administrator/User). Audited 2026-06-03:
  - Operator — `products` read, `qc_lots` create (`operator_id` preset `$CURRENT_USER`,
    cannot be spoofed) + read, `daas_files` create/read/update. No product writes, no lot
    update/delete.
  - PPIC — read-only across `products`, `qc_lots`, `qc_notifications`, `daas_files`.
  - Manager — read across all QC data + `system_health` + `qc_daily_stats`.
- **Back end:** DaaS enforces policies on every request (server-side proxy forwards the
  user's Supabase JWT; DaaS returns 403 for disallowed actions).
- **Front end:** role-gated dashboards (`app/(authenticated)/dashboard/*`,
  `components/dashboard/QcDashboards.tsx`).

## 3. Policy enforcement (RLS)

- Per-collection DaaS permissions per policy (action + field + filter), e.g. operator
  `products` read is filtered to `active = true`.
- **Server-side input validation** — `qc-lots-validate-create` filter rejects structurally
  invalid measurements on any write path (defence-in-depth behind the Zod schema in
  `app/api/qc/lots/route.ts`). Verified: invalid create returns a field-by-field error list.
- Boundary validation in the app with Zod on POST/PATCH routes.

## 4. Security

- **Secrets** — env-only (`.env.local`, gitignored); no secrets in source. MCP token files
  excluded by `.gitignore`.
- **Transport** — HTTPS via AWS Amplify; DaaS over TLS. 📄 infra.
- **Encryption at rest** — Supabase-managed Postgres (AES-256 at rest). 📄 infra.
- **CORS** — explicit origins + credentials (no wildcard), provisioned by `pnpm daas:setup`.
- **Input validation / immutability** — see §3 and §1.
- **MFA** — authentication is **Supabase Auth**; MFA (TOTP) is enforceable at the Supabase
  project level. (DaaS `enforce_tfa` policy flag is not present in this DaaS build, and
  would not gate Supabase-based login regardless — MFA belongs at the auth provider.) 📄

## 5. Scalability

- **Stateless** Next.js app on Amplify (serverless) → DaaS REST → Supabase. Horizontally
  scalable; no server session state.
- **Precomputed analytics** — `qc-daily-stats` writes one rollup row/day; the manager
  dashboard reads `qc_daily_stats` (precomputed-first, live-lots fallback) instead of
  scanning `qc_lots` (`components/dashboard/QcDashboards.tsx`,
  `lib/dashboard/qc-daily-stats.ts`).
- **Indexing** — primary keys and foreign keys are indexed by Postgres; high-traffic time
  filters (`qc_lots.checked_at`) are bounded by `limit` and short windows. 📄 Recommended
  follow-up: explicit B-tree index on `qc_lots.checked_at` and `qc_lots.product_id`.
- **CDN** — static assets served via the Amplify/CloudFront edge. 📄 infra.

## 6. Observability

- **Heartbeat** — `qc-heartbeat` samples DaaS latency + data freshness every 10 min into
  `system_health`; surfaced by the manager **System Health** widget
  (`components/dashboard/SystemHealthWidget.tsx`); a missing heartbeat >30 min reads as down.
- **Health endpoint** — `GET /api/health` liveness probe.
- **Error / anomaly tracking** — `qc-integrity-watch` turns the activity log into an alert
  feed; DaaS `logs` captures extension/api/db errors.
- **Audit logging** — DaaS activity log (see §1).

## 7. Clean docs

- This scorecard, plus: [`SECURITY.md`](SECURITY.md), [`ARCHITECTURE.md`](ARCHITECTURE.md),
  [`API.md`](API.md), [`SCHEMA.md`](SCHEMA.md), [`DAAS_EXTENSIONS.md`](DAAS_EXTENSIONS.md),
  [`DAAS_WORKFLOWS.md`](DAAS_WORKFLOWS.md), [`DAAS_READINESS.md`](DAAS_READINESS.md).
- Every DaaS cron/extension is snapshotted under [`docs/daas/`](daas/) and recreatable via
  the documented MCP steps + `pnpm daas:setup` / `pnpm daas:readiness`.

## 8. Deployability

- **CI** — `.github/workflows/ci.yml` runs lint + tests on push/PR (PR #5 merged green).
- **CD** — push to `main` triggers an AWS Amplify build (`amplify.yml`: pnpm install →
  `pnpm build`). Amplify builds from AWS CodeCommit; GitHub hosts PR review/CI.
- **Environments** — Amplify staging + production; env vars managed via the Buildpad
  platform MCP.
- **Local gate** — `pnpm install && pnpm build && pnpm test` before push.

---

_Backend object IDs and verification evidence are tracked in project memory; see
[`DAAS_EXTENSIONS.md`](DAAS_EXTENSIONS.md) for the live extension/cron inventory._
