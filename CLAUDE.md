# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The canonical multi-agent instruction file is **AGENTS.md** (also read by Codex). This file
imports it and adds Claude Code–specific context. Edit `AGENTS.md` for shared rules; edit
this file for Claude Code–only additions.

@AGENTS.md

---

## App Context

**App name:** Controme — computer-vision colour QC for PT Indo Aneka Atsiri (Sima Arome).
**Competition:** CyberHack 2026. **Current phase:** Phase 2 Core UI / Phase 3 Business Logic
(see `PHASES.md` for per-phase gate status).

Three user roles drive all RBAC and nav gating: `qc_operator`, `ppic`, `manager` (admin =
DaaS default Administrator). Role detection lives in `lib/auth/useAppRoles.ts`.

---

## Commands

```bash
pnpm install                  # install deps (use --frozen-lockfile in CI)
pnpm dev                      # Next.js dev server (Turbopack)
pnpm build                    # production build — NOTE: uses --webpack, not Turbopack
pnpm lint && pnpm tsc --noEmit  # lint + type-check
pnpm test                     # Vitest unit tests (all)
pnpm test -- path/to/file     # run a single test file
pnpm test:watch               # Vitest in watch mode
npx playwright test           # E2E tests (requires dev server running)
npx playwright test e2e/qc-flow-auth.spec.ts  # single E2E spec

# DaaS backend setup (requires daas MCP connected)
node scripts/setup-daas-rbac.mjs
node scripts/check-daas-readiness.mjs
```

**After generating any `.tsx` file**, run the raw-Mantine grep check and fix any matches:

```bash
grep -rn "from '@mantine/form'\|from '@mantine/dates'\|from '@mantine/dropzone'\|<TextInput\|<NumberInput\|<Select \|<Switch \|<Checkbox \|<DatePicker\|<Dropzone" app/ components/ 2>/dev/null
```

---

## Architecture

Two-tier from the browser's perspective. The browser calls only Next.js route handlers —
never Supabase or DaaS directly.

```
Browser → Next.js App Router → Buildpad DaaS REST API → Supabase Postgres + RLS
```

**Key proxy route families in `app/api/`:**

| Route | Purpose |
|---|---|
| `/api/auth/*` | Supabase auth proxy (login, logout, user, callback) |
| `/api/items/[collection]/[[id]]` | Generic DaaS collection CRUD proxy |
| `/api/files/*`, `/api/assets/*` | DaaS file/asset proxy |
| `/api/permissions/me` | Current user permission set |
| `/api/qc/lots` | QC lot creation — recomputes ΔE/status server-side from photo |
| `/api/qc/products/[id]/update-reference` | Versioned product reference update |
| `/api/export/lot/[id]` | PDF/Excel export for a lot |
| `/api/chat` | AI assistant (Google AI SDK) |
| `/api/cron/*` | DaaS cron admin proxy (DaaS RBAC gates admin-only access) |
| `/api/health` | Liveness probe (`{ status: "ok" }`) |

**`middleware.ts`** handles session refresh and redirects unauthenticated requests to `/login`.

**`app/(authenticated)/`** — all pages behind auth. `AuthenticatedAppShell.tsx` owns the
nav shell; role-gated nav items use `useAppRoles()`.

---

## Key Library Modules

### `lib/vision/` — image processing (browser + server)

| File | Runs in | Purpose |
|---|---|---|
| `sample-color.ts` | browser | Center ROI extraction, sRGB → CIE Lab via chroma-js |
| `roi.ts` | browser | ROI geometry helpers |
| `white-balance.ts` | browser | White-balance correction |
| `image-pipeline.server.ts` | server (Node/sharp) | Full pipeline: decode → ROI → Lab, used by `/api/qc/lots` |
| `reference-assistant.ts` | server | AI-assisted reference Lab derivation from a photo |
| `validation.ts` | shared | Input validation for vision inputs |

The browser preview (in `/qc/capture`) runs `sample-color.ts` for advisory feedback only.
The **stored verdict** is always recomputed server-side in `image-pipeline.server.ts` — the
client result is never trusted.

### `lib/domain/` — business logic

| File | Purpose |
|---|---|
| `qc.ts` | CIE76 ΔE evaluation, PASS/REJECT + channel flags, immutable lot builder |
| `colorimetry.ts` | Low-level Lab math, ΔE formula |
| `product-mapping.ts` | DaaS field ↔ domain type mapping |
| `qc-export.ts` | Export data shaping |
| `collection-guards.ts` | Immutability guards for lot records |
| `readiness.ts` | Schema/demo readiness checks |
| `reference-products.ts` | Seed Lab values for demo products |

### `lib/buildpad/` — Buildpad SDK (CLI-managed, never edit manually)

Hooks (`useAuth`, `useCollections`, `usePermissions`, relation hooks, etc.) and services.
Import from `@/lib/buildpad/hooks` or `@/lib/buildpad/services`. **Never hand-create files
here** — use `npx @buildpad/cli@latest add <component>`.

### `lib/auth/`

`useAppRoles.ts` — maps DaaS role names to typed role flags for UI gating.
`role-gating.ts` — server-side helpers for role enforcement.

### `lib/api/` — server-side proxy helpers

`auth-headers.ts` — current Supabase session JWT → DaaS `Bearer` + `getDaaSUrl()`.
`daas-proxy.ts` — generic forwarder (`proxyToDaaS`, `runProxy`) used by the cron proxy routes.

### `lib/dashboard/` — pure analytics/display helpers (co-located vitest)

`notifications.ts` (parse/rank `qc_notifications` briefs), `system-health.ts` (latest
heartbeat + stale detection), `qc-daily-stats.ts` (precomputed KPI rollup + per-product
pass-rate). Consumed by the manager dashboard widgets in `components/dashboard/`.

---

## Data Model Summary

Four **domain** collections + three **observability** collections (full schema in
`docs/SCHEMA.md`; backend objects inventoried in `docs/DAAS_EXTENSIONS.md`):

- **`products`** — colour reference per product (Lab values, tolerances, ΔE max). Reference
  changes are versioned via DaaS action hook → `product_reference_versions`.
- **`qc_lots`** — immutable QC records (create + read only). Append-only enforced both at the
  proxy (`lib/domain/collection-guards.ts`) and by DaaS filter hooks (UPDATE/DELETE blocked).
  Stores measured Lab, ΔE, pass/reject, contamination and consistency metrics, photo file ref.
- **`product_reference_versions`** — append-only reference history; one row per change.
- **`qc_notifications`** — alerts for reject/warning-band lots; acknowledged by `manager`.
- **`system_health`** — qc-heartbeat samples (latency + freshness; auto-pruned 7d).
- **`audit_archive`** — off-table copy of `daas_activity` before the 90-day purge.
- **`qc_daily_stats`** — one precomputed KPI rollup row per day.

DaaS audit log (`daas_activity`) captures every mutation automatically. Do not build a
custom audit trail. Backend logic lives in DaaS **runtime extensions** (validation +
append-only guards) and **cron jobs** (integrity-watch, heartbeat, audit-archive,
daily-stats, cta-brief) — see `docs/DAAS_EXTENSIONS.md` and `docs/ENTERPRISE_READINESS.md`.

---

## Claude Code Specifics

### Skills

Skills in `.claude/skills/` are auto-discovered as slash commands. The same skills also live
in `.agents/skills/` (Codex) and `.kiro/skills/` (Kiro IDE).

**Invoke before any multi-file work**: load the relevant background skill first, e.g.
`/buildpad-reference` before writing `.tsx`, `/daas-platform` before touching API routes.

**User-invokable:** `/create-project`, `/create-feature`, `/create-collection`,
`/create-api-route`, `/create-component`, `/create-migration`, `/create-workflow`,
`/create-cron`, `/create-rbac`, `/create-custom-permissions`, `/create-service`,
`/create-tests`, `/add-buildpad`, `/manage-scope`, `/add-microfrontend`, `/add-microservice`,
`/add-multitenancy`, `/add-external-oauth`, `/amplify-env-vars`, `/start-phase`,
`/review-code`, `/generate-docs`, `/idea-refine`, `/spec-driven-development`,
`/planning-and-task-breakdown`.

**Background (auto-loaded):** `daas-platform`, `authentication-proxy`, `buildpad-reference`,
`hooks-extensions`, `relational-permissions`, `security-and-hardening`,
`performance-optimization`, `debugging-and-error-recovery`, `git-workflow-and-versioning`,
`incremental-implementation`, `code-simplification`, `context-engineering`.

### Subagents (`~/.claude/agents/`)

Prefer these over re-deriving logic inline: `planner`, `architect`, `tdd-guide`,
`code-reviewer`, `security-reviewer`, `build-error-resolver`, `e2e-runner`,
`refactor-cleaner`, `doc-updater`.

### MCP

`.mcp.json` is gitignored. Copy `.mcp.json.example` and fill tokens. Three project servers:
`buildpad` (npx stdio), `daas` (HTTP + bearer → DaaS backend), `buildpad-platform` (HTTP +
bearer → Amplify management). Call `get_project_detail` first on any microservice/env work —
it auto-populates URLs and credentials so you never need to ask the user.

### Collaboration

Codex runs in parallel. Follow branch-per-task and pull-before-push rules in §0 of AGENTS.md.
