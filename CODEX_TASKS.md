# CODEX_TASKS.md — Active task board

> **Codex: read this file before starting any work.** It holds your current
> task, branch, and the files Claude owns (do not touch those). Coordinator =
> Claude Code. Protocol from **AGENTS.md §0** applies: branch per task, small
> atomic commits, `git pull --rebase origin main` before push, never force-push
> shared branches, open a PR to `main` and keep CI green.

## How we split work
- **One file / area per agent per slice** — this is the only way to avoid merge
  conflicts. Stay strictly inside your assigned files.
- Claude assigns scoped tasks below and owns the "Claude scope" list.
- When you finish: open a PR to `main`, then update the **Status** line here.

---

## 🔵 CODEX — current task

**Task:** Add search + filter to the **QC Lot History** page.

**Branch:** `feature/lot-search-codex`

**Own ONLY these files:**
- `app/(authenticated)/qc/lots/page.tsx`
- (optional, new) `lib/qc/lot-search.ts` + co-located `lib/qc/lot-search.test.ts`

**Requirements:**
- Live **search** by `lot_code` and product name.
- **Filter** by status (`pass` / `reject`) and `warning_flag`.
- Buildpad-first: use `@/components/ui/*` (e.g. `Input`) or Mantine
  `SegmentedControl` / `Chip`. **Do NOT use raw** `TextInput`, `Select`,
  `Switch`, `Checkbox`, `DatePicker`, `useForm`. After editing, run the
  raw-Mantine grep check from `CLAUDE.md`.
- **English** UI strings only.
- Put any non-trivial logic in the pure helper with Vitest tests.
- Keep `pnpm lint && pnpm tsc --noEmit && pnpm test` green.

**Acceptance:**
- Search narrows the list as you type; status + warning filters combine; empty
  state handled. lint + tsc + tests green. PR opened to `main`.

**Status:** UNCLAIMED  _(Codex: change to `IN-PROGRESS feature/lot-search-codex`
when you start, and `DONE PR #<n>` when merged.)_

---

## 🟡 CLAUDE scope — Codex, DO NOT edit these

- `components/dashboard/*` (hub, SPC, notifications, system-health, daily-stats)
- `app/(authenticated)/dashboard/manager/page.tsx`
- `lib/dashboard/*`
- DaaS backend config via MCP (crons, extensions, products, permissions) +
  product/seed data (e.g. the new Turmeric / extract products)

_Last updated by: Claude (coordinator)._
