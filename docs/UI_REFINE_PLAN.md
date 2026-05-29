# UI Refinement Plan — Controme (for Codex)

> **Owner of execution:** Codex. **Author:** Claude (Azka's tab).
> **Goal:** re-skin the existing Controme UI to match the official design system —
> without changing app logic, routes, test IDs, or visible text labels.
> The MVP is feature-complete and all tests pass; this is **visual refinement only**.

## References (read these first)

- `docs/Controme.png` — rendered design-system board (palette, type, components). **Source of truth.**
- `docs/Controme Design System.svg` — same board, vector (exact fills).
- `assets/light logo.png`, `assets/dark logo.png` — brand logos.
- Current implementation: `app/design-tokens.css`, `app/globals.css`, `lib/theme.ts`.

## Collaboration rules (AGENTS.md §0)

- **Branch:** `feature/ui-refine-codex` off `azka`. Do not touch `main` or `azka` directly.
- **Scope owned by this task (Codex may edit):**
  `app/design-tokens.css`, `app/globals.css`, `lib/theme.ts`, `app/layout.tsx` (font wiring only),
  and the domain UI files under `components/{vision,dashboard,export,navigation}/` +
  `app/(authenticated)/**` + `app/login/page.tsx` + `app/page.tsx` — **styling/props only.**
- **Claude owns logic** in those files. Coordinate before structural/logic edits. Pull before push.

---

## 🔴 HARD CONSTRAINTS — do not break these

1. **Buildpad-first / CLI-only files.** Never hand-edit `components/ui/**` or `lib/buildpad/**`.
   Restyle Buildpad components **only** via `lib/theme.ts` (Mantine `components` overrides) and the
   `--ds-*` tokens. If a component needs a structural change, wrap it in a new file under
   `components/`, do not modify the generated source.
2. **Preserve every `data-testid`.** The Playwright suite depends on them:
   `save-lot`, `saved-lot`, `saved-status`, `save-error`, `view-saved-lot`, `qc-status`,
   `qc-delta-e`, `color-status`, `contamination-status`, `consistency-status`, `warning-flag`,
   `qc-preview`, `reference-swatch`, `measured-swatch`, plus texture/powder ids. Keep all of them.
3. **Preserve visible text labels & headings** used by tests and nav gating:
   `QC Capture`, `QC Lot History`, `QC Lot Detail`, `PPIC Dashboard`, `Manager Dashboard`,
   `Product References`, `Save QC lot`, `Export CSV`, `Export PDF`, `View lot`, `Sign in`.
   Heading levels stay (`level={1}` page titles). You may restyle, not rename.
4. **No route, data, or behavior changes.** Pure presentation. `useAppRoles`, role-gating,
   server routes, QC logic are off-limits.
5. **Gate must stay green** after every milestone: `pnpm lint && pnpm tsc --noEmit && pnpm test &&
   npx playwright test && pnpm build`.
6. **Tokens only — no hard-coded colors/spacing** in components. Everything flows from `--ds-*`.

---

## Design tokens — target values (from the SVG)

Replace the burnt-orange/cream identity with the green brand. Update `app/design-tokens.css`
(`:root` + dark mode) and the fallbacks in `lib/theme.ts` to these.

### Brand / primary (deep green)
| Token | Hex | Use |
|---|---|---|
| `--ds-primary` | `#004838` | Brand Primary (deep green) — primary buttons, active nav, links |
| `--ds-primary-dark` | `#004D3E` | Brand Dark — hover/pressed, dark-filled "Dashboard" button |
| `--ds-primary-light` | `#0E8345` | Brand Light — secondary green, progress fills |
| `--ds-primary-muted` | `#E6F4EA` | Brand Muted — tints, selected row bg |
| `--ds-cta` | `#64B72F` | CTA lime (primary action buttons like "Install Free"/"Cari Lot") |
| `--ds-cta-alt` | `#86B637` | CTA hover/secondary lime |

Build the `--ds-primary-100..900` ramp from `#E6F4EA` (100) → `#004838`/`#003026` (900),
green-hued (not orange). `primaryShade` light=6-ish so filled buttons read as deep green;
the bright lime is a **separate `cta` color**, not `primary` shade.

### Status
| Token | Hex |
|---|---|
| `--ds-success` (PASS) | `#0E8345` |
| success tint (pass card bg) | `#E6F4EA` |
| `--ds-danger` (REJECT) | `#DC2626` |
| danger tint (reject card bg) | `#FEE2E2` |
| `--ds-warning` | `#D97706` |

### Surfaces (cool, replaces cream)
| Token | Hex |
|---|---|
| `--ds-body-bg` / Surface Base | `#FAFAFA` |
| Surface Deep (panels, sidebar) | `#EDEDFA` → `#D5D3F0` |
| Surface White | `#FFFFFF` |

### Text & border (zinc/indigo, replaces warm gray)
| Token | Hex |
|---|---|
| Text Primary | `#0D0B1F` |
| Text Secondary | `#2A2848` |
| Text Muted | `#71717A` |
| Border | `#CECECE` |

Rebuild `--ds-gray-100..950` on this cool ramp (`#FAFAFA`/`#F7F7FF` light → `#0D0B1F` dark),
and update `--ds-body-color-rgb`, `--ds-primary-rgb` (0,72,56), and the focus ring to green.

### Typography
- **Headings:** `Roboto Condensed` (700). **Body:** `Inter`.
- Wire both via `next/font/google` in `app/layout.tsx` (Inter already present — add Roboto
  Condensed), expose as CSS vars, and point `--ds-font-family` (body) + a new
  `--ds-font-heading` at them. Update `lib/theme.ts` `headings.fontFamily` →
  `var(--ds-font-heading)`.
- Remove the Space Grotesk / Fraunces `@import` from `app/globals.css`.

---

## Phase 1 — Foundation (do first, gate after)

1. Rewrite `app/design-tokens.css` `:root` + dark block with the green/cool palette above.
2. Swap fonts (layout font wiring + globals import + theme heading family).
3. Update `lib/theme.ts` token fallbacks to green equivalents; set `cta` color array;
   keep component overrides but verify they reference the new tokens.
4. **Gate.** Visually confirm: deep-green primary, lime CTA, Inter body, Roboto Condensed headings.

## Phase 2 — Component language (match the board)

Restyle via theme overrides + small wrapper components. Mirror the board's component row:

- **Buttons:** filled = deep-green; **primary CTA** ("Save QC lot", "Cari Lot", "Sign in") = lime
  `--ds-cta`; "Lihat Detail"/secondary = outline green; "Dashboard"-style = dark-green filled;
  disabled = muted gray. Pill radius (`xl`), weight 600 (already in theme).
- **Urgency chips / Badges:** PASS = green outline pill on `#E6F4EA`; REJECT = red outline pill on
  `#FEE2E2`; warning = amber. Keep the `qc-status` / `saved-status` / `color-status` testids.
- **Cards (Lot QC card):** white surface, soft shadow, rounded `md`; lot code bold (heading font),
  timestamp muted, status pill right-aligned. Apply to lot rows / detail header / dashboard tiles.
- **Search input:** rounded input + lime action button (lot history search / collection filters).
- **Status classification panels:** the REJECT (red tint) / PASS (green tint) explainer cards —
  reuse for the capture verdict + lot detail status block.

## Phase 3 — Apply per page

| Page / file | Refine |
|---|---|
| `app/login/page.tsx` | Brand logo (`assets/light logo.png`), green gradient/surface bg, lime "Sign in" |
| `AuthenticatedAppShell.tsx` + `AppRoleNavigation.tsx` | Logo in sidebar header (replace bare "Controme" text but keep the subtitle), green active item, Surface Deep sidebar bg |
| `app/page.tsx` | Style the loader/landing with brand spinner + logo |
| `components/vision/ColorQcCapture.tsx` | Verdict block as PASS/REJECT classification card; lime "Save QC lot"; keep ALL testids; result swatches per board |
| `qc/lots/page.tsx` (CollectionList) | Lot QC card styling via theme Table/Card overrides; search input style |
| `qc/lots/[id]/page.tsx` | Card-based detail; status pill header; green export buttons (keep "Export CSV"/"Export PDF") |
| `dashboard/{ppic,manager}/page.tsx` + `QcDashboards.tsx` | Metric tiles as branded cards; green pass-rate progress; pass/reject/warning pills; trend in brand greens |
| `admin/products/**` | Branded form/list; reference swatches |

## Verification (every phase)

```bash
pnpm lint && pnpm tsc --noEmit && pnpm test && npx playwright test && pnpm build
```

- All 71 unit + 15 E2E green (the E2E is the guard that you didn't rename a testid/label).
- Manual: `pnpm dev`, log in per role, compare each page side-by-side with `docs/Controme.png`.
- Dark mode still legible (green ramp inverted, surfaces dark).

## Done = 

Identity matches the board (green brand, Roboto Condensed/Inter, pill buttons, status cards),
gate green, zero logic/route/testid/label changes, dark mode intact, work on
`feature/ui-refine-codex` ready to merge into `azka`.
