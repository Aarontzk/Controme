# Development Phases — Retas Siber Imut

Phased delivery for the Buildpad/Next.js app (CyberHack 2026 · PT Indo Aneka Atsiri).
Single source of truth for progress. Complete each phase before the next.

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | ✅ Complete |
| 1 | Data Foundation | 🟡 In progress |
| 2 | Core UI | ⬜ Not started |
| 3 | Business Logic | ⬜ Not started |
| 4 | Relations | ⬜ Not started |
| 5 | Polish | ⬜ Not started |

---

## Phase 0 — Foundation ✅

- [x] Next.js 16 + Mantine v8 + Buildpad UI bootstrapped at repo root (47 components)
- [x] Auth proxy routes (`/api/auth/login|logout|user|callback`) + DaaS proxy routes
- [x] `DaaSProviderWrapper` (onAuthStateChange) in `app/(authenticated)/layout.tsx`
- [x] Supabase middleware (session refresh); logout clears `daas_resource_uri`
- [x] `.env.local` with Supabase + DaaS URLs (gitignored)
- [x] Dependencies aligned (Mantine v8, tiptap v3 deduped); native builds approved
- [x] ESLint flat config (Next core-web-vitals + react-hooks)
- [x] CI (`.github/workflows/ci.yml`): pnpm install → lint → build
- [x] Agent tooling: AGENTS.md / CLAUDE.md / .claude/skills / .codex / .mcp.json
- [x] **Gate:** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm build` all green;
      `pnpm dev` serves `/login` (200), `/` redirects (307), `/api/auth/user` (401)

**Outstanding (carried):**
- [ ] DaaS CORS via `mcp_daas_cors-settings` (needs `daas` MCP connected — Claude restart)
- [ ] Playwright config + smoke test (deferred to test setup in Phase 1)
- [ ] `middleware.ts` → `proxy.ts` rename (Next 16 deprecation, non-blocking)

---

## Phase 1 — Data Foundation 🟡

App = **Controme** (CV colour QC for Sima Arome). Domain locked from the PRD. Data model in
[docs/SCHEMA.md](docs/SCHEMA.md).

**Done (no DaaS backend needed — pure/shared + spec):**
- [x] Data model defined: `products`, `qc_lots` (immutable), `product_reference_versions`,
      RBAC roles — [docs/SCHEMA.md](docs/SCHEMA.md)
- [x] Shared QC domain logic in `lib/domain/`: CIE76 ΔE (`colorimetry.ts`), PASS/REJECT +
      channel-flag evaluation + immutable lot builder (`qc.ts`)
- [x] Demo product references seed values (`reference-products.ts`) — Ginger + Dragon Fruit
- [x] Vitest set up + **9 unit tests** for ΔE/evaluation (`qc.test.ts`) — `pnpm test` green
- [x] **Gate (logic):** `pnpm test`, `pnpm lint`, `pnpm build` all green

**Blocked on `daas` MCP (needs Claude/Codex restart with project `.mcp.json` loaded) —
backend / Farel via `/create-collection`, `/create-rbac`:**
- [ ] Create `products` + `qc_lots` + `product_reference_versions` DaaS collections
- [ ] Define 4 RBAC roles (admin / qc_operator / ppic / manager) + policies (`/create-rbac`)
- [ ] Seed 2 demo products + ≥2 pass/1 reject lots each (PRD §4.3)
- [ ] DaaS CORS (carried from Phase 0)
- [ ] **Gate:** collection APIs reachable via `/api/items/*` and permission-gated

> Division: Claude built the shared logic + schema spec + tests; the DaaS collection/seed/
> RBAC creation is the MCP-side step (Codex/Farel, who run with the `daas` MCP).

---

## Phases 2–5 — see copilot-instructions.md / create-project for deliverables
