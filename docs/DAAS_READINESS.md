# DaaS Readiness Checks

Use these checks before deployment or demo recording. They verify the backend fields and demo data
that the current Controme backend code expects.

## One-time / per-instance setup (`pnpm daas:setup`)

Some DaaS runtime config lives server-side (not in the repo) and must exist on every instance the
app talks to. Instead of applying it by hand via MCP, run the idempotent bootstrap:

```bash
pnpm daas:setup
```

It reads `.env.local` (`NEXT_PUBLIC_BUILDPAD_DAAS_URL` + `DAAS_STATIC_TOKEN`) and ensures, additively
(never removing existing config):

- **CORS** origins include the local dev + Playwright E2E ports
  (`http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:3100`, `http://127.0.0.1:3100`)
  with credentials enabled — unioned with whatever is already set (e.g. the Amplify URL).
- **`daas_files` permissions** required by the authenticated QC flow. Policies are resolved
  dynamically from existing `qc_lots` permissions (no hard-coded UUIDs): every policy that can
  *create* `qc_lots` (operators) gets `create`+`read`+`update` on `daas_files`; every policy that
  can *read* `qc_lots` (operators, PPIC, manager) gets `read`. Without these, `POST /api/qc/lots`
  fails with "Photo upload failed." and lot-detail photos 401.

Re-running is safe — it prints what (if anything) it changed and creates nothing that already exists.

## Required DaaS Fields

The code writes these fields during QC capture and reference updates:

| Collection | Required fields |
|---|---|
| `products` | `version` |
| `qc_lots` | `warning_flag`, `qc_stage`, `reference_version`, `lot_code` |

If any field is missing, `POST /api/qc/lots` or the reference update route can fail even though
TypeScript, lint, and build pass locally.

## Required Runtime Extensions

DaaS backend-first logic used by the current QC flow:

| Extension | Event | Expected effect |
|---|---|---|
| `qc-reference-autoversion` | `products.items.update` | Creates a `product_reference_versions` snapshot when reference fields change. |
| `qc-reject-notify` | `qc_lots.items.create` | Creates a `qc_notifications` alert for reject lots or warning for warning-band lots. |

Snapshots of the live extension code are stored in `docs/daas/`; operational
notes and verification evidence are in [DAAS_EXTENSIONS.md](DAAS_EXTENSIONS.md).

### Enterprise-readiness extensions, guards & cron jobs

Beyond the two QC `action` hooks above, the instance also runs the validation filter,
six append-only guards, and five scheduled jobs that back the enterprise-readiness
rubric (immutable audit, observability, performance). Their inventory, schedules, and
code snapshots are in [DAAS_EXTENSIONS.md](DAAS_EXTENSIONS.md), and the full rubric map
is in [ENTERPRISE_READINESS.md](ENTERPRISE_READINESS.md). Supporting collections that
must exist: `system_health`, `audit_archive`, `qc_daily_stats` (manager read perms).

## Required Workflow Definition

The Buildpad Automation > Workflows page should show these workflow definitions:

| Workflow | Collection | Expected instances |
|---|---|---|
| `Product Reference Approval` | `products` | one instance per seeded product, currently both `Approved Reference` |
| `QC Lot Disposition` | `qc_lots` | one instance per existing lot; pass lots start `Released`, reject lots start `Quality Hold`, warning lots start `PPIC Review` |
| `QC Alert Resolution` | `qc_notifications` | one instance per notification; unread alerts start `Open Alert` |

The workflows add `workflow_instance` and `workflow_state` to their assigned
collections. Operational notes and JSON snapshots are in
[DAAS_WORKFLOWS.md](DAAS_WORKFLOWS.md).

## Runtime Verification

Run the app with real `.env.local` values, log in as a manager/admin account, then open:

```text
GET /api/qc/schema-readiness
GET /api/qc/demo-readiness
GET /api/health
```

Or run the CLI check from the project root:

```bash
pnpm daas:readiness
```

The CLI reads `.env.local`, calls DaaS directly, and prints a JSON summary. It exits non-zero
when schema fields or demo seed coverage are missing.

Expected:

- `/api/qc/schema-readiness` returns `ready: true`.
- `/api/qc/demo-readiness` returns `data.ready: true`.
- `/api/health` returns `status: "ok"`.

## Demo Seed Requirements

The readiness check expects:

- at least 2 seeded products
- at least 4 PASS lots
- at least 2 REJECT lots
- at least 1 `warning_flag: true` lot
- at least 1 `qc_stage: "incoming"` lot
- at least 1 `qc_stage: "finish"` lot

If the check reports missing coverage, add/update seed lots through DaaS admin tooling before
recording the demo.

## MCP Fix Checklist

When the DaaS MCP is connected, verify schema first:

```json
{ "keys": ["products", "qc_lots"] }
```

Then add missing fields with `mcp_daas_fields`:

- `products.version`: integer, default `1`
- `qc_lots.warning_flag`: boolean, default `false`
- `qc_lots.qc_stage`: enum/string constrained to `incoming` or `finish`, default `incoming`
- `qc_lots.reference_version`: integer, default `1`
- `qc_lots.lot_code`: string, nullable, indexed/unique if DaaS supports it for operator lot traceability

After adding fields, re-run `/api/qc/schema-readiness`.

### Exact MCP Payload Template

Use this template only if a fresh DaaS instance reports missing fields. The current project
readiness check is expected to pass.

```json
{
  "name": "mcp_daas_fields",
  "arguments": {
    "action": "create",
    "data": [
      {
        "collection": "qc_lots",
        "field": "lot_code",
        "type": "string",
        "meta": {
          "interface": "input",
          "readonly": true,
          "note": "Operator-visible lot code used in dashboards and exports."
        },
        "schema": {
          "is_nullable": true
        }
      },
      {
        "collection": "products",
        "field": "version",
        "type": "integer",
        "meta": {
          "interface": "input",
          "readonly": true,
          "note": "Reference version used to freeze QC lot decisions."
        },
        "schema": {
          "default_value": 1,
          "is_nullable": false
        }
      },
      {
        "collection": "qc_lots",
        "field": "warning_flag",
        "type": "boolean",
        "meta": {
          "interface": "boolean",
          "readonly": true,
          "note": "True when passing Delta E is above 90% of the product threshold."
        },
        "schema": {
          "default_value": false,
          "is_nullable": false
        }
      },
      {
        "collection": "qc_lots",
        "field": "qc_stage",
        "type": "string",
        "meta": {
          "interface": "select-dropdown",
          "readonly": true,
          "options": {
            "choices": [
              { "text": "Incoming", "value": "incoming" },
              { "text": "Finish", "value": "finish" }
            ]
          },
          "note": "Traceability stage for QC Incoming vs QC Finish."
        },
        "schema": {
          "default_value": "incoming",
          "is_nullable": false
        }
      },
      {
        "collection": "qc_lots",
        "field": "reference_version",
        "type": "integer",
        "meta": {
          "interface": "input",
          "readonly": true,
          "note": "Product reference version used when this lot was checked."
        },
        "schema": {
          "default_value": 1,
          "is_nullable": false
        }
      }
    ]
  }
}
```

If the MCP tool name exposed in the current client is `fields` rather than
`mcp_daas_fields`, keep the same `arguments` object and change only `"name"` to `"fields"`.
