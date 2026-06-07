<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/light logo.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/dark logo.png">
  <img src="assets/dark logo.png" alt="Controme" width="280">
</picture>

<br/>
<br/>

**Computer-vision colour QC for PT Indo Aneka Atsiri (Sima Arome)**

*CyberHack 2026 — Tim Retas Siber Imut*

[![Production](https://img.shields.io/badge/Live%20Demo-Amplify-orange?style=flat-square&logo=amazonaws)](https://main.dpvw4kb04hrwl.amplifyapp.com/)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-YouTube-red?style=flat-square&logo=youtube)](https://youtu.be/l95T9xWPv3s?si=ld_PncZisgFBZggA)
[![Pitch Deck](https://img.shields.io/badge/Pitch%20Deck-Canva-blue?style=flat-square&logo=canva)](https://canva.link/tiycg2cv1ije2xh)

</div>

---

<img src="assets/hero login.png" alt="Controme Login Screen" width="100%">

<div align="center">

<br/>

**Demo Video**

<a href="https://youtu.be/l95T9xWPv3s?si=ld_PncZisgFBZggA">
  <img src="https://img.youtube.com/vi/l95T9xWPv3s/maxresdefault.jpg" alt="Tonton Demo Video Controme" width="100%">
</a>

</div>

---

## What is Controme?

Controme digitizes Sima Arome's extract & powder QC pipeline. A photo of a sample is scored **server-side** for color deviation (ΔE), contamination, and texture consistency against an approved product reference, then written as an **immutable** lot record that flows to PPIC and Manager dashboards.

**Status:** Phases 0–3 feature-complete. Full vision-QC workflow live end-to-end — auth-gated capture, immutable lot history, role dashboards, product-reference admin with version history, CSV/PDF export, Gemini-powered "Ask AI" rail, enterprise-grade observability (cron jobs, append-only guards, audit archive, daily stats), and admin-managed employee accounts. Backed by live Buildpad DaaS collections, RBAC, runtime extensions, and native workflows.

## Features

| Area | What it does | Route |
|---|---|---|
| QC Capture | Camera or upload → server recomputes ΔE + contamination + texture from the photo (`sharp`); lot number auto-generated; browser preview is advisory only | `/qc/capture` |
| Lot History | Immutable list of every QC lot, newest-first; corrections create new records, never edits | `/qc/lots`, `/qc/lots/[id]` |
| PPIC Dashboard | Shift/stage QC clearance overview for production planning | `/dashboard/ppic` |
| Manager Dashboard | Pass-rate, ΔE trend, SPC panel, risk lots + **Ask AI** rail (Gemini, reads live `qc_lots`), QC briefs & alerts | `/dashboard/manager` |
| Product Admin | Reference color standards (`ref_l/a/b`, `delta_e_max`) with Lab swatches, filters, and full version history | `/admin/products`, `/admin/products/[id]` |
| Account Admin | Admin-managed employee account creation + role assignment | `/dashboard/admin` |
| Lot Export | CSV/PDF export of lot records | `/api/export/lot/[id]` |
| Enterprise Observability | DaaS cron jobs: integrity watch (hourly), heartbeat (10-min), audit archive (daily), daily KPI rollup | `/api/cron/*` |

## Stack

Two-tier from the browser: **Next.js → DaaS → Supabase**. The browser never calls DaaS or Supabase directly — all traffic goes through same-origin Next.js route handlers (no CORS leak, server-only creds).

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 |
| UI | Mantine v8 + Buildpad UI, collapsible sidebar |
| Vision | `sharp` (server-side ROI + masking + EXIF orient), `chroma-js` (sRGB→CIE Lab, ΔE) |
| AI | Vercel AI SDK + Google Gemini (`@ai-sdk/google`, `gemini-2.5-flash`) |
| Backend | Buildpad DaaS REST API (CRUD, RBAC, audit log, files, runtime extensions, native workflows) |
| Database | Supabase PostgreSQL + Row Level Security |
| Auth | Supabase Auth via server-side proxy (`/api/auth/*`) |
| Tests | Vitest (unit) + Playwright (E2E) |
| Deploy | AWS Amplify (push to `main` → `amplify.yml` build) |

## Quick Start

Requires **Node 24 + pnpm 10+**.

```bash
git clone https://github.com/Aarontzk/Controme.git retas-siber-imut
cd retas-siber-imut
pnpm install
cp .mcp.json.example .mcp.json   # fill DaaS tokens (live values in .env.local)
pnpm dev                         # → http://localhost:3000
```

`.env.local` (gitignored) holds live Supabase + DaaS values from the Buildpad scaffold, plus
`GOOGLE_GENERATIVE_AI_API_KEY` + `GEMINI_MODEL_ID` for Ask AI.

### Scripts

```bash
pnpm dev                    # Next.js dev server (turbopack)
pnpm build                  # production build (.next)
pnpm test                   # Vitest unit tests
pnpm lint                   # eslint
pnpm tsc --noEmit           # typecheck
pnpm exec playwright test   # E2E
pnpm daas:setup             # reproduce DaaS RBAC + CORS config
pnpm daas:readiness         # verify live DaaS schema + demo seed
```

## Roles

Four roles enforced **backend (DaaS policies) and frontend (scoped navigation)**:

| Role | Access |
|---|---|
| QC Operator | Capture lots, view own history |
| PPIC | Production planning dashboard |
| Manager | Manager dashboard + Ask AI insight rail |
| Admin | Product reference management, account creation, full access |

## Architecture

```text
Browser ──same-origin HTTPS──> Next.js 16 App Router
                                 ├─ /api/auth/*        Supabase Auth proxy
                                 ├─ /api/qc/*          vision QC + lots
                                 ├─ /api/items/*        DaaS data proxy
                                 ├─ /api/files,assets/* DaaS file proxy
                                 ├─ /api/chat           Ask AI (Gemini stream)
                                 ├─ /api/cron/*         DaaS cron admin proxy
                                 └─ /api/health         health check
                                        │
                                        v
                              Buildpad DaaS REST API
                      (CRUD · RBAC · audit log · files · extensions · workflows)
                                        │
                                        v
                              Supabase Postgres + RLS
```

**Runtime extensions:** `qc-reference-autoversion` snapshots product reference edits, `qc-reject-notify` writes reject/warning alerts. Append-only filter guards block UPDATE/DELETE on `qc_lots`, `product_reference_versions`, and `audit_archive` at the DaaS layer (defence-in-depth behind the Next proxy guard).

**Native workflows:** Product Reference Approval, QC Lot Disposition, QC Alert Resolution — see [docs/DAAS_EXTENSIONS.md](docs/DAAS_EXTENSIONS.md) and [docs/DAAS_WORKFLOWS.md](docs/DAAS_WORKFLOWS.md).

## Data Model

Seven collections: four domain + three observability.

| Collection | Type | Purpose |
|---|---|---|
| `products` | Domain | Colour reference per product (Lab values, tolerances, ΔE max) |
| `qc_lots` | Domain | Immutable QC records — measured Lab, ΔE, pass/reject, photo ref |
| `product_reference_versions` | Domain | Append-only reference change history |
| `qc_notifications` | Domain | Reject/warning alerts; acknowledged by manager |
| `system_health` | Observability | Heartbeat samples — latency + freshness (auto-pruned 7d) |
| `audit_archive` | Observability | Off-table copy of `daas_activity` before 90-day purge |
| `qc_daily_stats` | Observability | Precomputed daily KPI rollup |

## Documentation

| Doc | Purpose |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design + ADRs |
| [docs/API.md](docs/API.md) | Endpoint contract |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Database schema + ERD |
| [docs/SECURITY.md](docs/SECURITY.md) | RBAC, audit trail, encryption |
| [docs/SETUP.md](docs/SETUP.md) | Dev environment setup |
| [docs/ENTERPRISE_READINESS.md](docs/ENTERPRISE_READINESS.md) | 8-component enterprise rubric scorecard |
| [docs/DAAS_READINESS.md](docs/DAAS_READINESS.md) | Live DaaS schema + demo seed verification |
| [docs/DAAS_EXTENSIONS.md](docs/DAAS_EXTENSIONS.md) | DaaS runtime extension code/config |
| [docs/DAAS_WORKFLOWS.md](docs/DAAS_WORKFLOWS.md) | Native DaaS workflow definitions |
| [docs/VISION_POC.md](docs/VISION_POC.md) | Browser-only color QC PoC (`/poc/vision`) |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Implementation change history |

## Enterprise Readiness

8 components per CyberHack rubric — all complete:

- [x] Audit trail — DaaS logs all mutations; append-only guards on `qc_lots` + `audit_archive`; daily off-table archive
- [x] RBAC — 4 roles enforced backend (DaaS policies) + frontend (scoped nav); admin account provisioning
- [x] Policy enforcement — Supabase RLS, all access mediated by DaaS, server-side verdict recompute
- [x] Security — HTTPS, sa