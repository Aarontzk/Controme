# Technical Architecture
### Controme — AI-Powered QC & Operations Platform
#### CyberHack 2026 · Tim Retas Siber Imut · PT Indo Aneka Atsiri (Sima Arome)

---

## Overview

Controme is built on a **two-tier proxy architecture** where the browser never communicates directly with the database or backend services. All traffic flows through a secure Next.js server layer, ensuring credentials stay server-side and the audit trail cannot be tampered with from the client.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER / TABLET LAB                     │
│              (QC Operator · PPIC · Manager · Admin)         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS · Same-Origin
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS 16 — APP ROUTER                    │
│                                                             │
│   /api/auth/*     →  Supabase Auth proxy                    │
│   /api/items/*    →  DaaS collection proxy                  │
│   /api/qc/*       →  QC logic + vision pipeline             │
│   /api/activity   →  Immutable audit log proxy              │
│   /api/health     →  Liveness check                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ Bearer token · Server-to-Server
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               BUILDPAD DaaS — REST API                      │
│                                                             │
│   Collections   ·   RBAC Policies   ·   DaaS Files         │
│   Activity Log  ·   Relations       ·   Permissions         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            SUPABASE POSTGRESQL + ROW LEVEL SECURITY         │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│              SERVER-SIDE VISION PIPELINE                    │
│                                                             │
│   Photo Upload                                              │
│       → EXIF Auto-Orient (Sharp)                            │
│       → Gray-World White Balance                            │
│       → Linear-Light CIELAB Extraction                      │
│       → ΔE CIE76 vs. Product Reference                      │
│       → Contamination Blob Detection                        │
│       → Texture & Consistency Analysis                      │
│       → PASS / REJECT Verdict                               │
│       → Stored to DaaS (immutable)                          │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│                   AWS AMPLIFY — CI/CD                       │
│                                                             │
│   GitHub push to main                                       │
│       → pnpm install                                        │
│       → pnpm build  (.next)                                 │
│       → Deploy to production URL                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · TypeScript 5 | UI rendering, routing, SSR |
| **UI Components** | Mantine v8 · Buildpad UI (Copy & Own) | Design system, form components |
| **API Layer** | Next.js Route Handlers (`/api/*`) | Secure server-side proxy |
| **Backend** | Buildpad DaaS (Data-as-a-Service) | Collections, RBAC, files, audit |
| **Database** | Supabase PostgreSQL + RLS | Persistent storage, row-level security |
| **Authentication** | Supabase Auth via server-side proxy | Session management, JWT |
| **Vision Engine** | Sharp · chroma-js · CIELAB color space | Server-side image analysis |
| **Testing** | Vitest (unit) · Playwright (E2E) | 80 unit tests · 15 E2E tests |
| **Deployment** | AWS Amplify · GitHub Actions CI | Auto-deploy on `main` |

---

## Unique Technical Implementations

---

### 1 · Server-Authoritative Vision Pipeline

The quality verdict is **never trusted from the browser**. Every time a QC lot is saved:

1. The raw photo bytes are sent to the Next.js server via `POST /api/qc/lots`
2. **Sharp** processes the image server-side: EXIF orientation fix, downscale cap, gray-world white balance
3. The system extracts the average L\*, a\*, b\* values from the powder region using linear-light colour averaging
4. **ΔE (CIE76)** is computed against the registered product reference
5. Contamination is detected via connected-component blob analysis — relative to powder brightness, not a fixed cutoff
6. Texture consistency is assessed via brightness standard deviation and local contrast metrics
7. The final PASS / REJECT verdict and all metrics are written to the database

The browser preview is **advisory only** — a tampered client request cannot forge a passing verdict.

---

### 2 · Two-Tier Proxy Architecture

```
Browser  ──►  Next.js API Routes  ──►  Buildpad DaaS  ──►  Supabase
```

The browser has **zero direct access** to Supabase or the DaaS backend. All auth, data, file, and permission traffic goes through Next.js server-side route handlers. This design:

- Keeps server credentials (`DAAS_STATIC_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`) off the client entirely
- Eliminates CORS exposure — no cross-origin requests from the browser
- Allows server-side business logic enforcement before any database write

---

### 3 · Immutable Append-Only Data Model

QC lot records (`qc_lots`) are **write-once** at both the API and database level:

- `POST /api/qc/lots` is the only way to create a record
- `PATCH` and `DELETE` on `qc_lots` are blocked at the proxy layer
- No UI surface exposes an edit or delete action for lot records
- Corrections are made by creating a **new record** referencing the old one

The DaaS activity log automatically records every mutation across all collections — this is the immutable audit trail required for enterprise readiness.

---

### 4 · Versioned Product Reference Management

When R&D updates a product's colour standard (L\*, a\*, b\*, ΔE threshold):

- A **new version row** is appended to `product_reference_versions`
- The `products` table increments its `version` field
- Every new QC lot record stores the `reference_version` integer at the moment of capture

Historical records are **never retroactively affected**. A lot checked against version 1 of Ginger Powder always shows version 1 values — even after an admin updates to version 2.

---

### 5 · Role-Based Access Control (4 Roles)

Enforced at **both** the frontend (route gating, navigation) and backend (DaaS permission policies per collection).

| Role | Permissions |
|---|---|
| **QC Operator** | Create QC lots · Read products · No reference edits |
| **PPIC** | Read lots + clearance dashboard · No QC create |
| **Manager** | Read all · Export COA/CSV · Dashboards |
| **Admin** | Manage products/references · Manage users · Cannot edit QC records |

Every API endpoint validates the caller's role before executing. RBAC is not only a UI concern — it is enforced server-side on every request.

---

### 6 · Enterprise Readiness Checks

Three built-in endpoints verify the system is production-ready at any point:

| Endpoint | What it checks |
|---|---|
| `GET /api/health` | Service liveness — returns `{ "status": "ok" }` |
| `GET /api/qc/schema-readiness` | All required DaaS fields exist in live schema |
| `GET /api/qc/demo-readiness` | Demo seed data coverage (PASS · REJECT · warning · both QC stages) |

CLI equivalent: `pnpm daas:readiness` — exits non-zero if anything is missing, blocking deployment.

---

## Data Flow Summary

### QC Capture Flow

```
QC Operator uploads photo
    → POST /api/qc/lots (multipart)
    → Server: Sharp processes photo
    → Server: ΔE + contamination + consistency computed
    → Server: Photo uploaded to DaaS Files
    → Server: Immutable qc_lots record created (with photo reference)
    → Response: verdict returned to browser
    → DaaS: activity log entry written automatically
    → PPIC Dashboard: lot clearance status updated
    → Manager Dashboard: pass rate metrics refreshed
```

### Lot Export Flow

```
Manager clicks Export
    → GET /api/qc/export?product_id=...&status=...
    → Server: fetches qc_lots + product names from DaaS
    → Server: builds CSV with all measurements, timestamps, operators
    → Response: file download (text/csv or application/pdf)
```

---

## Deployment Topology

| Environment | Entry Point | Backend |
|---|---|---|
| **Local Dev** | `pnpm dev` → `localhost:3000` | DaaS URL from `.env.local` |
| **E2E Testing** | Playwright → `127.0.0.1:3100` | Same proxy path |
| **Production** | AWS Amplify (auto-deploy from `main`) | Buildpad DaaS + Supabase |

---

*Document: `docs/PITCH_TECHNICAL_ARCHITECTURE.md` · Controme · CyberHack 2026 · Tim Retas Siber Imut*
