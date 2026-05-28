# Changelog

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
