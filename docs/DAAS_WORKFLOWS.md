# DaaS Workflows

This DaaS instance uses native workflow definitions for product reference
approval, QC lot disposition, and QC alert resolution. Runtime extensions still
handle side effects such as version snapshots and reject notifications;
workflows handle visible lifecycle state in the Buildpad Automation > Workflows
screens.

## Installed Definition

| Name | Collection | Assignment | Purpose |
|---|---|---|---|
| `Product Reference Approval` | `products` | `b27f35c8-a7a7-4f13-b20a-747b95d3d67d` | Review and approve product reference Lab/tolerance values before they drive QC decisions. |
| `QC Lot Disposition` | `qc_lots` | `c53b9f00-6dc7-4243-bcdf-24f56664ee80` | Route recorded lots through PPIC review, release, hold, manager review, or closure. |
| `QC Alert Resolution` | `qc_notifications` | `55112190-b80a-4343-b1db-395b33f38b9d` | Track generated reject/warning alerts from open through investigation, escalation, and resolution. |

Snapshots:

- [`docs/daas/product-reference-approval-workflow.json`](daas/product-reference-approval-workflow.json)
- [`docs/daas/qc-lot-disposition-workflow.json`](daas/qc-lot-disposition-workflow.json)
- [`docs/daas/qc-alert-resolution-workflow.json`](daas/qc-alert-resolution-workflow.json)

## Product Reference States

| State | Commands |
|---|---|
| `Draft Reference` | `Submit for QC Review` -> `QC Review` |
| `QC Review` | `Approve Reference` -> `Approved Reference`; `Request Revision` -> `Needs Revision` |
| `Needs Revision` | `Resubmit for QC Review` -> `QC Review` |
| `Approved Reference` | `Reopen Reference` -> `Draft Reference` |

Command `policies` are currently empty, which means DaaS allows anyone with
write access to `products` to run the transition. Product writes are already
admin-gated in this app; add policy IDs to commands later if separate
transition-level authorization is needed.

## QC Lot Disposition States

| State | Commands |
|---|---|
| `Recorded` | `Send to PPIC Review` -> `PPIC Review` |
| `PPIC Review` | `Release Lot` -> `Released`; `Place Quality Hold` -> `Quality Hold` |
| `Quality Hold` | `Escalate to Manager` -> `Manager Review`; `Close Hold` -> `Closed` |
| `Manager Review` | `Approve Exception Release` -> `Released`; `Close as Rejected` -> `Closed` |
| `Released` | `Reopen Review` -> `PPIC Review` |
| `Closed` | `Reopen Review` -> `PPIC Review` |

Backfill summary: 45 lots in `Released`, 32 in `Quality Hold`, and 3 in
`PPIC Review`.

## QC Alert Resolution States

| State | Commands |
|---|---|
| `Open Alert` | `Start Investigation` -> `Investigating` |
| `Investigating` | `Resolve Alert` -> `Resolved`; `Escalate Alert` -> `Escalated` |
| `Escalated` | `Resolve Escalation` -> `Resolved`; `Return to Investigation` -> `Investigating` |
| `Resolved` | `Reopen Alert` -> `Open Alert` |

Backfill summary: 1 notification in `Open Alert`.

## Workflow Fields

The `products`, `qc_lots`, and `qc_notifications` collections now have DaaS
workflow fields:

| Field | Type | Notes |
|---|---|---|
| `workflow_instance` | uuid m2o -> `daas_wf_instance` | Hidden, readonly. Links each row to its workflow instance. |
| `workflow_state` | string | Readonly workflow UI state using `xtr-interface-workflow`. |

The two seeded demo products were backfilled to `Approved Reference`:

| Product | Workflow instance |
|---|---|
| Dragon Fruit Powder | `9b9921be-e066-4ff1-a965-6ca4cfaf9959` |
| Spray-Dried Ginger Powder | `bda87387-de55-41ff-9b08-6a116530c708` |

## Recreate

Use the DaaS MCP tools:

1. Add `workflow_instance` and `workflow_state` to each assigned collection
   with the metadata described above.
2. Create each `daas_wf_definition` row from the JSON snapshots.
3. Create one `daas_wf_assignment` row per collection with `filter_rule: {}`.
4. For existing rows, create `daas_wf_instance` rows and update each row with
   its `workflow_instance` and `workflow_state`.
