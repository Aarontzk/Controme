# Controme

> Vision-based quality-control platform for **PT Indo Aneka Atsiri (Sima Arome)**.
> CyberHack 2026 submission by **Tim Retas Siber Imut** (Aludra, Salsa, Azka, Farel).

Controme digitizes Sima Arome's extract & powder QC: a photo of a sample is scored
**server-side** for color deviation (ΔE), contamination, and texture consistency against an
approved product reference, then written as an **immutable** lot record that flows to PPIC
and Manager dashboards.

**Status:** Full vision-QC workflow live end-to-end — auth-gated capture, immutable lot
history, role dashboards, product-reference admin, CSV/PDF export, and a Gemini-powered
"Ask AI" rail on the Manager dashboard. Backed by live Buildpad DaaS collections, RBAC,
runtime extensions, and workflows.

## Live Demo

- Production: https://main.dpvw4kb04hrwl.amplifyapp.com/
- Demo video: https://youtu.be/l95T9xWPv3s?si=ld_PncZisgFBZggA
- Pitch deck: https://www.canva.com/design/DAHLJMyMVq4/09JpMXuUuvlMYUCp9khQCQ/edit

## Features

| Area | What it does | Route |
|---|---|---|
| QC Capture | Upload/camera capture → server recomputes ΔE + contamination + texture from the photo (`sharp`); browser preview is advisory only | `/qc/capture` |
| Lot History | Immutable list of every QC lot; corrections create new records, never edits | `/qc/lots`, `/qc/lots/[id]` |
| PPIC Dashboard | Shift/stage QC overview for production planning | `/dashboard/ppic` |
| Manager Dashboard | Pass-rate, ΔE trend, risk lots + **Ask AI** rail (Gemini, reads live `qc_lots`) | `/dashboard/manager` |
| Product Admin | Manage reference color standards (`ref_l/a/b`, `delta_e_max`) + version history | `/admin/products`, `/admin/products/[id]` |
| Lot Export | CSV/PDF export of lot records | `/api/export/lot/[id]` |

## Stack

Two-tier from the browser: **Next.js → DaaS → Supabase**. The browser never calls DaaS or
Supabase directly — all traffic goes through same-origin Next.js route handlers (no CORS leak,
server-only creds).

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 |
| UI | Mantine v8 + Buildpad UI |
| Vision | `sharp` (server-side ROI + masking), `chroma-js` (sRGB→CIE Lab, ΔE) |
| AI | Vercel AI SDK + Google Gemini (`@ai-sdk/google`, `gemini-2.5-flash`) |
| Backend | Buildpad DaaS REST API (CRUD, RBAC, audit log, files, extensions, workflows) |
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
pnpm dev                 # Next.js dev server (turbopack)
pnpm build               # production build (.next)
pnpm test                # Vitest unit tests
pnpm lint                # eslint
pnpm tsc --noEmit        # typecheck
pnpm exec playwright test   # E2E
pnpm daas:setup          # reproduce DaaS RBAC + CORS config
pnpm daas:readiness      # verify live DaaS schema + demo seed
```

## Roles

Four roles enforced **backend (DaaS policies) and frontend (scoped navigation)**:

| Role | Access |
|---|---|
| QC Operator | Capture lots, view own history |
| PPIC | Production planning dashboard |
| Manager | Manager dashboard + Ask AI insight rail |
| Admin | Product reference management, full access |

## Architecture

```text
Browser ──same-origin HTTPS──> Next.js 16 App Router
                                 ├─ /api/auth/*    Supabase Auth proxy
                                 ├─ /api/qc/*      vision QC + lots
                                 ├─ /api/items/*   DaaS data proxy
                                 ├─ /api/files,assets/*  DaaS file proxy
                                 ├─ /api/chat      Ask AI (Gemini stream)
                                 └─ /api/health    health check
                                        │
                                        v
                              Buildpad DaaS REST API
                              (CRUD · RBAC · audit log · files · extensions · workflows)
                                        │
                                        v
                              Supabase Postgres + RLS
```

DaaS runtime extensions handle backend-first logic: `qc-reference-autoversion` snapshots
reference edits, `qc-reject-notify` writes reject/warning notifications. Native DaaS
workflows drive Product Reference Approval, QC Lot Disposition, and QC Alert Resolution. See
[docs/DAAS_EXTENSIONS.md](docs/DAAS_EXTENSIONS.md) and [docs/DAAS_WORKFLOWS.md](docs/DAAS_WORKFLOWS.md).

## Documentation

| Doc | Purpose |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design + ADRs |
| [docs/API.md](docs/API.md) | Endpoint contract |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Database schema + ERD |
| [docs/SECURITY.md](docs/SECURITY.md) | RBAC, audit trail, encryption |
| [docs/SETUP.md](docs/SETUP.md) | Dev environment setup |
| [docs/DAAS_READINESS.md](docs/DAAS_READINESS.md) | Live DaaS schema + demo seed verification |
| [docs/DAAS_EXTENSIONS.md](docs/DAAS_EXTENSIONS.md) | DaaS runtime extension code/config |
| [docs/DAAS_WORKFLOWS.md](docs/DAAS_WORKFLOWS.md) | Native DaaS workflow definitions |
| [docs/VISION_POC.md](docs/VISION_POC.md) | Browser-only color QC PoC (`/poc/vision`) |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Implementation change history |

## Enterprise Readiness

Tracking 8 components per CyberHack rubric:

- [x] Audit trail — DaaS logs all mutations; lot records immutable (corrections = new rows)
- [x] RBAC — 4 roles enforced backend (DaaS policies) + frontend (scoped nav)
- [x] Policy enforcement — Supabase RLS, access mediated by DaaS
- [x] Security — HTTPS, server-side proxy, secrets via env only, server-side verdict recompute
- [x] Scalability — stateless Next.js, indexed DaaS collections, Amplify CDN
- [x] Observability — `/api/health`, DaaS activity logs
- [x] Documentation — README, API, schema, architecture, security
- [x] Deployability — CI (lint+test) + AWS Amplify from `main`

## Team

| Name | Role |
|---|---|
| Aludra | UI/UX Designer |
| Salsa | Concept & Market Researcher |
| Azka | AI/Vision + Frontend Engineer |
| Farel | Backend Engineer & System Manager |

## AI-Assisted Development (Claude Code + Codex)

Two agents work in parallel — **Claude Code** in one tab, **Codex** in the sidebar.

| File | Loaded by | Purpose |
|---|---|---|
| [`AGENTS.md`](AGENTS.md) | Codex (auto) | **Canonical** instructions — stack, rules, skills, MCP, collaboration |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code (auto) | Imports `AGENTS.md` + Claude-specific notes |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Copilot | Full Buildpad platform steering (authoritative) |

> Edit **`AGENTS.md`** to change instructions — `CLAUDE.md` imports it, keeping both in sync.

**Skills** (`.claude/skills/<name>/SKILL.md`) are reusable task playbooks; Claude Code
auto-discovers them as slash commands, Codex reads on demand (catalog in `AGENTS.md` §4).
**MCP servers** (`buildpad`, `daas`, `buildpad-platform`): copy `.mcp.json.example` →
`.mcp.json` (gitignored) and fill tokens. Branch per task, small atomic commits,
`git pull --rebase` before push — full rules in `AGENTS.md` §0.

## License

MIT — see [LICENSE](LICENSE).
