# Architecture

_Finalized after stack lock (24 May 2026, 18:00 WIB)._

## System Diagram

```
TBA — high-level component diagram
```

## Stack

| Layer | Tech | Decided |
|---|---|---|
| Frontend | TBA (Vite+React vs Next.js) | 24 May |
| Backend | TBA (Supabase vs AWS Lambda/ECS) | 24 May |
| Database | TBA (Supabase Postgres vs RDS) | 24 May |
| Auth | TBA (Supabase Auth vs Cognito) | 24 May |
| Storage | TBA (Supabase Storage vs S3) | 24 May |
| Deploy FE | TBA (Vercel vs S3+CloudFront) | 24 May |
| Deploy BE | TBA | 24 May |
| Observability | TBA (CloudWatch vs Sentry) | 24 May |

## Stack Candidates

See [planning doc Section 5](../README.md) — Jalur A / B / C decision framework.

## Architecture Decision Records

ADRs live in this file under `## ADR-NNN` headings. Format per planning doc Section 12.

### ADR-001: TBD

_First ADR will document the stack lock decision on 24 May._

## Data Flow

_TBA after schema + API contract solidify (Day 2)._

## Deployment Topology

_TBA after stack lock — separate diagrams for staging vs production._
