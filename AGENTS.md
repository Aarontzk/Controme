# Retas Siber Imut — Agent Instructions

> Canonical instruction file for AI coding agents on this repo.
> **Codex** loads this `AGENTS.md` automatically. **Claude Code** loads `CLAUDE.md`,
> which imports this file. Keep both tools in sync by editing **this file**.

You are assisting **Tim Retas Siber Imut** on their **CyberHack 2026** submission for
industry partner **PT Indo Aneka Atsiri (Sima Arome)**. Build an enterprise-ready
full-stack web application on the **Buildpad RAD platform** that satisfies the CyberHack
rubric (see README → Enterprise Readiness).

The full platform steering — every hard rule, table, and workflow — is in
[`.github/copilot-instructions.md`](.github/copilot-instructions.md). **That file is
authoritative.** This file is the operating summary + cross-tool collaboration layer.

---

## 0. Two-Agent Collaboration (Claude Code + Codex)

This repo is driven by **two agents at once**: Claude Code (tab) and Codex (sidebar).
Both read the same instructions (`AGENTS.md` ⇄ `CLAUDE.md`) and the same skills in
`.claude/skills/`. To avoid stepping on each other:

- **Branch per agent / per task.** Never both edit `main`. Use `feature/<area>-<agent>`
  if working the same area concurrently (e.g. `feature/auth-claude`, `feature/auth-codex`).
- **Small, atomic commits.** Commit each working slice so the other agent can rebase on it.
- **Announce scope.** Before a multi-file change, state which files/dirs you own for that
  slice so the other agent stays out of them.
- **Pull before push.** `git pull --rebase origin <branch>` before pushing; resolve
  conflicts locally, never force-push shared branches.
- **One source of truth for instructions.** Edit `AGENTS.md`; `CLAUDE.md` imports it.

---

## 1. Stack — Buildpad RAD Platform

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| UI | Mantine v8 + **Buildpad UI** (Copy & Own via `@buildpad/cli`) |
| Backend | Buildpad **DaaS** (Data-as-a-Service REST API) |
| Database | Supabase PostgreSQL + Row Level Security |
| Auth | Supabase Auth via **server-side proxy** (`/api/auth/*`) |
| Testing | Playwright (E2E) + Vitest (unit) |
| Package mgr | **pnpm** |
| CI / Deploy | GitHub Actions + **AWS Amplify** (push to `main` → build/deploy, `amplify.yml`) |

Two-tier architecture: `Frontend (Next.js) → DaaS Backend (REST) → Supabase`. The frontend
talks to DaaS, never directly to Supabase.

> The Buildpad/Next.js app is bootstrapped **at the repo root** (`app/`, `components/ui/`
> with 47 Buildpad components, `lib/buildpad/`, `middleware.ts`, auth + DaaS proxy routes
> under `app/api/`). The old FastAPI `backend/` and Vite `frontend/` scaffolds have been
> removed — DaaS is the backend, Next.js is the frontend. Build/run with pnpm (below).

### Dev commands

```bash
pnpm install          # install deps
pnpm dev              # Next.js dev server
pnpm build            # production build (.next)
pnpm test             # Vitest unit tests
pnpm lint && pnpm tsc --noEmit
npx playwright test   # E2E
```

---

## 2. Hard Rules (from copilot-instructions.md — always apply)

1. **🔴 Buildpad-First components.** Before writing ANY `.tsx` with form inputs, lists, or
   filters, use Buildpad components from `@/components/ui` — never raw Mantine
   form/input (`TextInput`, `Select`, `DatePicker`, `Switch`, `useForm`, custom collection
   `Table`/filters). Load the `buildpad-reference` skill for the catalog. After generating
   `.tsx`, run the raw-Mantine grep check and fix matches before proceeding.
2. **CollectionList-first** for every collection listing view; **VForm/CollectionForm** for
   forms. No custom tables/filters for collection data.
3. **Server-side proxy (no CORS).** All browser→backend calls go through Next.js routes:
   `/api/auth/*` for Supabase auth, `/api/*` for DaaS data. Never call `supabase.auth.*` or
   the DaaS backend directly from the client.
4. **Backend-first logic.** Use DaaS built-ins (automatic audit/activity log, runtime
   extensions, workflows, cron, RBAC, scope, files, versions) instead of hand-building them
   in Next.js. **Never build a custom audit trail** — DaaS logs all mutations.
5. **DaaS CORS = explicit origins + credentials.** Never ship `cors_origins: ["*"]` with
   credentialed fetch. Set concrete origins (local ports + Amplify URLs) via
   `mcp_daas_cors-settings` on every new project.
6. **External OAuth via Next.js proxy** (not Supabase dashboard OAuth) — use
   `add-external-oauth`; honor IdP single-logout (`idpLogoutUrl`).
7. **Prerequisites + context discovery.** Verify `node`/`pnpm`/`git` before project work;
   call `get_project_detail` MCP to auto-populate `.env.local`/URLs — never ask the user
   for values that are in the context.
8. **Phased delivery.** Phases 0–5: Foundation → Data → Core UI → Business Logic →
   Relations → Polish. Never build the whole app at once.
9. **Tests & docs required.** Every feature ships Playwright + Vitest tests and a docs
   update. Target ≥80% coverage on changed code.
10. **Execute, don't explain.** Run commands and apply edits; don't just describe them.
11. **Secrets via env only.** No hardcoded secrets; read `.env.local` (gitignored).

### CyberHack enterprise-readiness focus

Scored on 8 components — keep in view every feature: immutable audit trail, RBAC (≥3 roles,
front + back), policy enforcement (RLS), security (HTTPS, encryption at rest, secrets mgmt),
scalability (stateless, indexing, CDN), observability (logging, health, error tracking),
clean docs, deployability (CI/CD, staging + prod). Most map directly to DaaS built-ins
(RBAC, audit, scope, RLS) — use them. See `docs/SECURITY.md`.

---

## 3. Git, CI & Deployment

- Initial local branch from the starter is `temporary-local`. **Create a feature branch
  before working** — never commit directly to `main`.
- Conventional commits: `feat|fix|refactor|docs|test|chore|perf|ci: <description>`.
- Short-lived branches (merge within 1–3 days), atomic commits, rebase on `main` often.
- **Deployment follows Buildpad/Amplify:** push to `main` triggers an AWS Amplify build via
  `amplify.yml` (pnpm install → `pnpm build` → `.next`). Validate locally first:
  `pnpm install && pnpm build && pnpm test`. Manage env vars / redeploys / build logs via
  the Buildpad platform MCP tools (skill `amplify-env-vars`).
- CI (`.github/workflows/ci.yml`) runs lint + tests on push/PR. Keep it green.
- Full guidance: skill `git-workflow-and-versioning`.

---

## 4. Skills (`.claude/skills/`)

Reusable task playbooks in `SKILL.md` format. **Claude Code** auto-discovers them as slash
commands (`/create-project`, `/create-collection`, `/review-code`, …) and background
context. **Codex** does not auto-discover project skills — when a task matches one, **read
the relevant `.claude/skills/<name>/SKILL.md`** and follow it.

**User-invokable:** `create-project`, `create-feature`, `create-collection`,
`create-api-route`, `create-component`, `create-migration`, `create-workflow`,
`create-cron`, `create-rbac`, `create-custom-permissions`, `create-service`,
`create-tests`, `add-buildpad`, `manage-scope`, `add-microfrontend`, `add-microservice`,
`add-multitenancy`, `add-external-oauth`, `amplify-env-vars`, `start-phase`, `review-code`,
`generate-docs`, `idea-refine`, `spec-driven-development`, `planning-and-task-breakdown`.

**Background (auto-loaded):** `daas-platform`, `authentication-proxy`, `buildpad-reference`,
`hooks-extensions`, `relational-permissions`, `security-and-hardening`,
`performance-optimization`, `debugging-and-error-recovery`, `git-workflow-and-versioning`,
`incremental-implementation`, `code-simplification`, `context-engineering`.

Templates for project bootstrap live in `.claude/templates/` (minimal/standard/enterprise).

---

## 5. MCP Servers

- **Claude Code** → `.mcp.json` (live, gitignored). Copy from `.mcp.json.example`, fill
  tokens.
- **Codex** → configure in global `~/.codex/config.toml`; merge the `[mcp_servers.*]` blocks
  from `.codex/config.toml`. See `.codex/README.md`.

Servers: `buildpad` (npx stdio — Buildpad CLI/MCP), `daas` (HTTP + bearer — project DaaS
backend), `buildpad-platform` (HTTP + bearer — Amplify mgmt: env vars, redeploy, build/
access/compute logs). Standard env-var workflow: `amplify_get_env_vars` →
`amplify_set_env_vars` → `amplify_redeploy` → `amplify_get_status` → `amplify_get_build_log`
on failure.

**Never commit MCP files containing tokens.** `.gitignore` excludes `.mcp.json`,
`.codex/config.toml`, `.kiro/settings/mcp.json`, `.vscode/mcp.json`.

---

## 6. Code Standards

- **TypeScript**: strict mode, interfaces over types, `as const` for constants.
- **React/Next**: Server Components by default, `'use client'` only when needed. PascalCase
  components, camelCase `use`-prefixed hooks, one component per file, co-locate tests.
- **Imports**: always `@/components/ui/` and `@/lib/buildpad/`, never `@buildpad/*`. Never
  hand-create files in `components/ui/` or `lib/buildpad/` — CLI only.
- **Errors & input validation at boundaries** (Zod on POST/PATCH). Immutability — return new
  objects, don't mutate. Many small focused files (200–400 lines typical, 800 max).

---

## 7. Environment Variables (`.env.local`, gitignored)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_BUILDPAD_DAAS_URL=...
NEXT_PUBLIC_MICROSERVICE_URL_MAIN=...
```

The starter generated `.env.local` with live values from the Buildpad scaffold. Always read
it for actual values; never hardcode. Prefer `get_project_detail` (MCP) to auto-populate.
App URLs for microservices go in committed `config/app-urls.ts` (not env) — see
copilot-instructions.md.
