# Development Phases — Retas Siber Imut

Phased delivery for the Buildpad/Next.js app (CyberHack 2026 · PT Indo Aneka Atsiri).
Single source of truth for progress. Complete each phase before the next.

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | ✅ Complete |
| 1 | Data Foundation | ✅ Complete |
| 2 | Core UI | 🟡 In progress |
| 3 | Business Logic | 🟡 In progress |
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

**Backend (done 2026-05-28 via `daas` MCP):**
- [x] Created `products` + `qc_lots` (immutable) + `product_reference_versions` collections
      with indexes (`qc_lots.product_id|status|checked_at`) and relations
- [x] RBAC roles `qc_operator` / `ppic` / `manager` + per-collection policies (admin = default
      Administrator); qc_lots is create+read only for operators
- [x] Seeded 2 demo products + 6 lots (2 pass / 1 reject each, PRD §4.3)
- [x] DaaS CORS set to explicit credentialed origins (localhost + Amplify)
- [x] **Gate:** collections reachable via `/api/items/*` and permission-gated

---

## Phase 2 — Core UI 🟡

- [x] Auth-gated QC capture at `/qc/capture` (Buildpad-first; products fetched from DaaS)
- [x] Immutable lot history at `/qc/lots` via `CollectionList`
- [x] App shell + role-scoped navigation for `qc_operator`, `ppic`, `manager`, and `admin`
- [x] Product management UI via `CollectionList` + `CollectionForm`
- [x] Lot detail view with immutable read-only diagnostics

## Phase 3 — Business Logic 🟡

- [x] Server-authoritative QC: `/api/qc/lots` recomputes ΔE + contamination + consistency from
      the photo (sharp, EXIF, white balance) — client preview is advisory only
- [x] Immutable lot persistence + photo upload to DaaS Files; built-in `daas_activity` audit
- [x] Capture metadata fields: `qc_stage`, `lot_code`, `note`, warning band surfacing
- [x] PPIC/manager dashboards with clearance summary, pass rate, Delta E trend, rejects/warnings
- [x] Reference version history view + CSV/PDF lot export
- [ ] Backend trigger for `product_reference_versions` on product edits (Farel dependency)

## Phases 4–5 — see copilot-instructions.md / create-project for deliverables
