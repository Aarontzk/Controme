# CODEX_TASKS.md — Active task board

> **Codex: read this file before starting any work.** It holds your current
> task, branch, and the files Claude owns (do not touch those). Coordinator =
> Claude Code. Protocol from **AGENTS.md §0** applies: branch per task, small
> atomic commits, `git pull --rebase origin main` before push, never force-push
> shared branches, open a PR to `main` and keep CI green.

## ✅ You have your own worktree (use it)
Codex works in a **separate folder** so there is no collision with Claude:

```
C:/Users/Lenovo/Projects/controme-codex   ← Codex (branch: feature/products-search-codex)
C:/Users/Lenovo/Projects/retas-siber-imut ← Claude (branch: main)
```

The worktree already has `node_modules`, `.env.local`, and `.codex/config.toml`.
**Open Codex in `C:/Users/Lenovo/Projects/controme-codex` and work there.**
Separate folder = separate git HEAD/index → true parallel branches.

## Commit discipline (still applies)
- Stage **only your own files**: `git add <your/exact/paths>` — never `git add -A`/`.`.
- `git status` before commit; confirm only your files are staged.
- One agent runs git at a time.

## How we split work
- One file / area per agent per slice. Stay inside your assigned files.
- When you finish: open a PR to `main`, update the **Status** line, keep CI green.

---

## 🔵 CODEX — current task

**Task:** Add **search + filter** to the **Products** admin list.

**Branch:** `feature/products-search-codex` (already checked out in your worktree).

**Own ONLY these files:**
- `app/(authenticated)/admin/products/page.tsx`
- (optional, new) `lib/qc/product-search.ts` + co-located `lib/qc/product-search.test.ts`

**Requirements:**
- Live **search** by product `name`, `code`, and `sku`.
- **Filter** by `category` and `active` (true/false).
- Buildpad-first: use `@/components/ui/*` (e.g. `Input`) or Mantine
  `SegmentedControl` / `Chip`. **Do NOT use raw** `TextInput`, `Select`,
  `Switch`, `Checkbox`, `DatePicker`, `useForm`. After editing, run the
  raw-Mantine grep check from `CLAUDE.md`.
- **English** UI strings only.
- Put non-trivial filter logic in the pure helper with Vitest tests.
- Keep `pnpm lint && pnpm tsc --noEmit && pnpm test` green.

**Acceptance:**
- Search narrows the list live; category + active filters combine; empty state
  handled. lint + tsc + tests green. PR opened to `main`.

**Status:** UNCLAIMED  _(Codex: set `IN-PROGRESS feature/products-search-codex`
when you start, `DONE PR #<n>` when merged.)_

---

## ✅ Done
- **QC Lot History search/filter** — `lib/qc/lot-search.ts` + page wiring, shipped
  to `main` (via #16). 5 tests passing.

## 🟡 CLAUDE scope — Codex, DO NOT edit these
- `components/dashboard/*` (hub, SPC, notifications, system-health, daily-stats)
- `app/(authenticated)/dashboard/manager/page.tsx`
- `lib/dashboard/*`
- DaaS backend config via MCP (crons, extensions, products, permissions) +
  product/seed data (Turmeric, Patchouli, etc.)

_Last updated by: Claude (coordinator)._
