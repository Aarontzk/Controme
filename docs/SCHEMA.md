# Database Schema

_To be defined Day 2 (26 May 2026) by Backend Engineer._

## ERD

```
TBA — Mermaid or PlantUML diagram here
```

## Core Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE | |
| role | text | admin / operator / end_user |
| created_at | timestamptz | |

### `audit_logs` (append-only)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users.id | nullable for system actions |
| action | text | e.g. `create_order`, `update_inventory` |
| resource_type | text | |
| resource_id | text | |
| payload | jsonb | before/after diff |
| ip_address | inet | |
| created_at | timestamptz | indexed |

**Constraint:** no UPDATE, no DELETE — enforced via revoked grants + trigger.

### Domain tables

_TBA — depends on problem statement._

## Indexes

_TBA — populate as queries solidify in Day 3-4._

## RLS Policies

See [SECURITY.md](SECURITY.md).
