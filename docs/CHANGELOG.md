# Changelog

## 2026-06-03 - Enterprise observability, audit archive & append-only QC

- Added DaaS cron jobs: `qc-integrity-watch` (hourly tamper/anomaly scan),
  `qc-heartbeat` (10-min health + data-freshness sample), `qc-audit-archive`
  (daily off-table copy of `daas_activity` before the 90-day purge), and
  `qc-daily-stats` (daily precomputed KPI rollup).
- Added six append-only filter guards (UPDATE/DELETE blocked on `qc_lots`,
  `product_reference_versions`, `audit_archive`) and a `qc-lots-validate-create`
  server-side validation filter — defence-in-depth behind the Next proxy guard.
- Added collections `system_health`, `audit_archive`, `qc_daily_stats` with
  manager read perms.
- Frontend: manager System Health widget (`system_health`), Daily QC rollup strip
  (`qc_daily_stats`), QC briefs & alerts panel (`qc_notifications`), and migrated
  the pass-rate + ΔE panels to precomputed stats with a live-lots fallback.
- Docs: added `ENTERPRISE_READINESS.md` (8-component rubric scorecard) and
  snapshotted every new cron/extension under `docs/daas/`. (PR #5, #6.)

## 2026-05-29 - DaaS runtime extensions

- Added live DaaS action extensions for backend-first business logic:
  `qc-reference-autoversion` snapshots product reference edits into
  `product_reference_versions`, and `qc-reject-notify` writes reject/warning
  rows to `qc_notifications`.
- Added the native DaaS `Product Reference Approval` workflow definition,
  assignment to `products`, workflow fields on `products`, and backfilled the
  two seeded products to `Approved Reference`.
- Added native DaaS `QC Lot Disposition` and `QC Alert Resolution` workflows,
  assigned them to `qc_lots` and `qc_notifications`, and backfilled existing
  rows to 80 lot workflow instances plus 1 alert workflow instance.
- Added `qc_notifications` read access for viewer policies and documented the
  live DaaS automation code/config in `docs/daas/`, `docs/DAAS_EXTENSIONS.md`,
  and `docs/DAAS_WORKFLOWS.md`.

## 2026-05-28 - App shell RBAC

- Added the F1 authenticated app shell with Buildpad `ContentLayout` /
  `ContentNavigation`, role-scoped frontend navigation for QC Operator, PPIC,
  Manager, and Admin, and placeholder routes for F2-F5 dashboards/admin work.
- Added F2-F5 frontend: live camera fallback capture, QC stage/lot/note fields,
  warning-band surfacing, immutable lot detail, PPIC/manager dashboards,
  product reference management, reference version history view, and CSV/PDF lot
  export.

## 2026-05-28 — Vision QC to production

- Completed Phase 1 DaaS backend: `products`, `qc_lots` (immutable), and
  `product_reference_versions` collections with indexes and relations; CORS set
  to explicit credentialed origins; seeded 2 products + 6 lots.
- Added RBAC: `qc_operator`, `ppic`, `manager` roles with per-collection
  policies (admin = default Administrator).
- Promoted the vision spike to a real, auth-gated feature at `/qc/capture` with
  an immutable `/qc/lots` history list.
- ΔE + contamination + consistency are now recomputed **server-side** from the
  uploaded photo (`/api/qc/lots`, sharp) — the browser preview is advisory only,
  so a tampered client request cannot forge a verdict.
- Hardened the pipeline for uncontrolled phone photos: EXIF auto-orientation,
  downscale cap, full-frame gray-world white balance, linear-light colour
  averaging, and zod upload validation.
- Fixed a contamination miss: foreign objects are now flagged relative to the
  powder brightness (not an absolute cutoff) and rejected via connected-component
  blob detection, so a single small stone rejects even at a tiny global ratio.
- Added unit tests for white balance, upload validation, product mapping, the
  contamination blob lane, and a sharp end-to-end pipeline test; renamed product
  references to Controme.
- Added backend hardening for `warning_flag`, `qc_stage`, and `reference_version`
  persistence; added CSV COA export, product reference versioning update route,
  and `/api/health`.
- Added DaaS readiness endpoints and docs so the team can verify live schema fields and
  demo seed coverage before Amplify deployment.

## 2026-05-28

- Added Vision Color QC PoC documentation covering the browser pipeline,
  deterministic fixtures, manual generated-image prompts, and Day 1 limitations.
- Expanded the Vision PoC with powder-only masking, rule-based contamination
  detection, and lighting warnings for more realistic photo checks.
- Added a rule-based texture/consistency lane plus browser-only session
  calibration for generated or camera samples under shifted lighting.
- Calibrated the ginger demo seed reference against generated tray-photo
  samples and added PNG Playwright fixtures for smooth, bright, blue, and rough
  powder inputs.
- Rewrote architecture and API docs to match the current Next.js proxy plus
  Buildpad DaaS stack, and synchronized schema docs with the latest vision
  metrics.
- Replaced stale setup instructions from the removed FastAPI/Vite scaffold with
  the current pnpm/Next.js workflow.
- Updated security documentation to use DaaS permissions, DaaS audit activity,
  and the Next.js proxy boundary instead of custom audit infrastructure.
- Added the cleaned Retas Siber Imut research and PRD document, aligned with
  the current color, contamination, and texture screening PoC.
