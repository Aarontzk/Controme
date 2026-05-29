# Changelog

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
