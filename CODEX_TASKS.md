# CODEX_TASKS.md — Active task board

> **Codex: read this file before starting any work.** It holds your current
> task, branch, and the files Claude owns (do not touch those). Coordinator =
> Claude Code. Protocol from **AGENTS.md §0** applies: branch per task, small
> atomic commits, `git pull --rebase origin main` before push, never force-push
> shared branches, open a PR to `main` and keep CI green.

## ✅ You have your own worktree (use it)
Codex works in a **separate folder** so there is no collision with Claude:

```
C:/Users/Lenovo/Projects/controme-codex   ← Codex
C:/Users/Lenovo/Projects/retas-siber-imut ← Claude (branch: feature/ux-polish-claude)
```

The worktree already has `node_modules`, `.env.local`, and `.codex/config.toml`.
**Open Codex in `C:/Users/Lenovo/Projects/controme-codex` and work there.**
Separate folder = separate git HEAD/index → true parallel branches.

**Start fresh from main** (your last branch is merged):
```bash
git fetch origin
git checkout main && git pull --rebase origin main
git checkout -b feature/products-swatch-codex
```

## Commit discipline (still applies)
- Stage **only your own files**: `git add <your/exact/paths>` — never `git add -A`/`.`.
- `git status` before commit; confirm only your files are staged.
- One agent runs git at a time.

## How we split work
- One file / area per agent per slice. Stay inside your assigned files.
- When you finish: open a PR to `main`, update the **Status** line, keep CI green.

---

## 🔵 CODEX — current task

**Task:** Add a **reference colour swatch** to the **Products** admin list so a
manager can eyeball each product's target colour, not just raw L*a*b* numbers.

**Branch:** `feature/products-swatch-codex` (create from fresh `main`, see above).

**Own ONLY these files:**
- `app/(authenticated)/admin/products/page.tsx`
- (new) `lib/qc/lab-swatch.ts` + co-located `lib/qc/lab-swatch.test.ts`

**Requirements:**
- New pure helper `labToHex({ L, a, b })` in `lib/qc/lab-swatch.ts`. Use
  **`chroma-js`** (already a dependency — see `lib/vision/sample-color.ts` for
  usage) to convert CIE Lab → hex. Guard against null/NaN/out-of-range channels;
  return a safe fallback (e.g. `null`) the UI renders as a neutral placeholder.
- In the products list, add a **"Reference"** swatch column via the
  `CollectionList` **`renderCell`** prop (it already exists — do NOT build a
  custom table). For the row, read `ref_l`/`ref_a`/`ref_b`, convert with
  `labToHex`, and render a Mantine **`ColorSwatch`** (size ~20) with a tooltip
  showing `L a b`. Fall back to a dimmed "—" when values are missing.
- Keep the existing search / category / active filters and the create CTA
  untouched and working.
- **English** UI strings only. Buildpad-first (no raw `TextInput`/`Select`/etc).
  After editing run the raw-Mantine grep check from `CLAUDE.md`.
- Vitest covers `labToHex`: a known colour (e.g. mid-grey), an out-of-gamut
  clamp, and the null/NaN fallback. Keep `pnpm lint && pnpm tsc --noEmit &&
  pnpm test` green.

**Acceptance:**
- Products list shows a colour swatch per row; hovering shows the Lab triplet;
  missing values render a placeholder, not a crash. Helper unit-tested. lint +
  tsc + tests green. PR opened to `main`.

**Status:** READY — not started.  _(Codex: set `IN-PROGRESS feature/products-swatch-codex`
when you start, `DONE PR #<n>` when merged.)_

---

## ✅ Done
- **Products admin filters** — `lib/qc/product-search.ts` + page wiring, shipped
  to `main` (via PR #20). 10 `lib/qc` tests passing.
- **QC Lot History search/filter** — `lib/qc/lot-search.ts` + page wiring, shipped
  to `main` (via #16). 5 tests passing.

## 🟡 CLAUDE scope — Codex, DO NOT edit these
- `components/dashboard/*` (hub, SPC, notifications, system-health, daily-stats)
- `app/(authenticated)/dashboard/manager/page.tsx`
- `app/(authenticated)/dashboard/ppic/page.tsx`
- `app/(authenticated)/qc/lots/[id]/page.tsx` (lot detail)
- `lib/dashboard/*`
- DaaS backend config via MCP (crons, extensions, products, permissions) +
  product/seed data (Turmeric, Patchouli, etc.)

_Currently on Claude's plate (branch `feature/ux-polish-claude`): UX polish —
PPIC English fix, lot-detail timestamp + back link, manager hub card hover._

_Last updated by: Claude (coordinator)._
