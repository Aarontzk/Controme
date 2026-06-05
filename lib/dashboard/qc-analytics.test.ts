import { describe, expect, it } from "vitest";

import {
  aggregatePassRates,
  buildDeltaTrend,
  getRejectedOrWarning,
  summarizeClearance,
  type QcLotAnalyticsRow,
} from "./qc-analytics";

const rows: QcLotAnalyticsRow[] = [
  {
    id: "1",
    product_id: { id: "ginger", name: "Ginger" },
    lot_code: "LOT-1",
    status: "pass",
    delta_e: 1.2,
    checked_at: "2026-05-28T01:00:00.000Z",
  },
  {
    id: "2",
    product_id: { id: "ginger", name: "Ginger" },
    lot_code: "LOT-2",
    status: "reject",
    delta_e: 6.1,
    checked_at: "2026-05-28T02:00:00.000Z",
  },
  {
    id: "3",
    product_id: { id: "dragon", name: "Dragon Fruit" },
    lot_code: "LOT-3",
    status: "pass",
    warning_flag: true,
    delta_e: 4.2,
    checked_at: "2026-05-28T03:00:00.000Z",
  },
];

describe("qc analytics", () => {
  it("aggregates pass rate by product", () => {
    expect(aggregatePassRates(rows)).toEqual([
      {
        productId: "dragon",
        productName: "Dragon Fruit",
        total: 1,
        pass: 1,
        reject: 0,
        passRate: 1,
      },
      {
        productId: "ginger",
        productName: "Ginger",
        total: 2,
        pass: 1,
        reject: 1,
        passRate: 0.5,
      },
    ]);
  });

  it("summarizes clearance status", () => {
    expect(summarizeClearance(rows)).toEqual({
      pending: 0,
      cleared: 2,
      rejected: 1,
      warning: 1,
    });
  });

  it("builds chronological delta trend points", () => {
    expect(buildDeltaTrend(rows, 2)).toEqual([
      { label: "LOT-2", deltaE: 6.1 },
      { label: "LOT-3", deltaE: 4.2 },
    ]);
  });

  it("returns reject and warning rows newest first", () => {
    expect(getRejectedOrWarning(rows).map((row) => row.id)).toEqual(["3", "2"]);
  });
});
