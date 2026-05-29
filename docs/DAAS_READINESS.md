# DaaS Readiness Checks

Use these checks before deployment or demo recording. They verify the backend fields and demo data
that the current Controme backend code expects.

## Required DaaS Fields

The code writes these fields during QC capture and reference updates:

| Collection | Required fields |
|---|---|
| `products` | `version` |
| `qc_lots` | `warning_flag`, `qc_stage`, `reference_version` |

If any field is missing, `POST /api/qc/lots` or the reference update route can fail even though
TypeScript, lint, and build pass locally.

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

After adding fields, re-run `/api/qc/schema-readiness`.

### Exact MCP Payload For The Current Gap

The latest readiness check reported these missing fields:

- `products.version`
- `qc_lots.warning_flag`
- `qc_lots.qc_stage`
- `qc_lots.reference_version`

Run this through Claude Code / DaaS MCP when the MCP server is connected:

```json
{
  "name": "mcp_daas_fields",
  "arguments": {
    "action": "create",
    "data": [
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
