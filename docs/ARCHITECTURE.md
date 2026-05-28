# Architecture

_Current as of 28 May 2026._

Controme is a Buildpad RAD application for Sima Arome's extract and powder QC
workflow. The production architecture is intentionally two-tier from the
browser's point of view:

```text
Browser
  |
  | same-origin HTTPS
  v
Next.js 16 App Router
  |-- app UI and client PoCs
  |-- /api/auth/* Supabase Auth proxy
  |-- /api/items/* DaaS data proxy
  |-- /api/files/* and /api/assets/* DaaS file proxy
  v
Buildpad DaaS REST API
  |-- collection CRUD
  |-- permissions and roles
  |-- audit/activity logs
  |-- files and assets
  v
Supabase Postgres + RLS
```

The browser never calls Supabase or DaaS directly. All auth, collection, file,
relation, and permission traffic goes through Next.js route handlers to avoid
CORS leakage and keep server-only credentials out of client code.

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 App Router, React 19, TypeScript 5 | App lives at repo root. |
| UI | Mantine v8 + Buildpad UI | Buildpad-first for collection forms/lists. |
| Backend | Buildpad DaaS REST API | Data, permissions, audit, files. |
| Database | Supabase PostgreSQL + RLS | Access mediated by DaaS. |
| Auth | Supabase Auth via Next.js proxy | `/api/auth/*`, server-side cookies. |
| Tests | Vitest + Playwright | Unit in node; browser canvas via E2E. |
| Deploy | AWS Amplify | `amplify.yml` builds `.next`. |

## Current Feature Slice

The implemented Vision PoC is isolated at `/poc/vision`:

- Browser-only image upload and canvas sampling.
- Center ROI extraction with `getImageData`.
- Powder/background masking.
- Rule-based contamination detection.
- Rule-based texture/consistency detection.
- sRGB to CIE Lab conversion with `chroma-js`.
- Delta E and pass/reject delegated to `lib/domain/evaluateSample`.
- No auth gating, DaaS persistence, storage upload, or lot creation yet.

See [VISION_POC.md](VISION_POC.md).

## Data Flow

### Vision PoC

```text
User image
  -> <img> object URL
  -> hidden canvas
  -> center ROI ImageData
  -> lib/vision/sample-color.ts
  -> chroma-js Lab conversion
  -> lib/domain/evaluateSample
  -> pass/reject UI
```

This path runs entirely in the browser. It is a proof of the measurement
pipeline, not the final lot-record workflow.

### Future QC Lot Capture

```text
QC operator
  -> authenticated capture screen
  -> file upload via /api/files
  -> QC measurement
  -> POST /api/items/qc_lots
  -> DaaS activity log + Supabase row
  -> PPIC/manager dashboards
```

Lot records must be immutable: corrections create new records, not edits.

## Deployment Topology

| Environment | Entry point | Backend |
|---|---|---|
| Local | `pnpm dev` on `localhost:3000` | DaaS URL from `.env.local` |
| E2E | Playwright starts Next on `127.0.0.1:3100` | Same proxy path |
| Production | AWS Amplify build from `main` | Buildpad DaaS + Supabase |

## ADRs

### ADR-001: Use Buildpad RAD Platform

Decision date: 24 May 2026.

Controme uses Next.js + Buildpad UI + Buildpad DaaS + Supabase instead of the
old FastAPI/Vite scaffold. This gives the team built-in collection management,
permissions, files, audit logs, and Amplify deployment paths required by the
CyberHack enterprise-readiness rubric.

### ADR-002: Keep Browser Vision PoC Isolated

Decision date: 28 May 2026.

The first vision slice is browser-only and intentionally not wired to auth,
DaaS, storage, or lot records. It proves the color/texture/contamination
measurement pipeline with deterministic unit and Playwright coverage before the
team commits to the persistent KAN-50 capture workflow.
