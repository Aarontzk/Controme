import { describe, expect, it } from "vitest";

import {
  aggregateProductPassRates,
  avgDeltaTrend,
  latestStat,
  orderByDate,
  rejectRateTrend,
  type QcDailyStatRow,
} from "./qc-daily-stats";

const rows: QcDailyStatRow[] = [
  { stat_date: "2026-06-02", total_lots: 10, reject_count: 2, reject_rate: 0.2 },
  { stat_date: "2026-05-31", total_lots: 8, reject_count: 0, reject_rate: 0 },
  { stat_date: "2026-06-01", total_lots: 12, reject_count: 6, reject_rate: 0.5 },
];

describe("orderByDate", () => {
  it("orders oldest→newest and drops dateless rows", () => {
    const ordered = orderByDate([...rows, { total_lots: 99 }]);
    expect(ordered.map((row) => row.stat_date)).toEqual([
      "2026-05-31",
      "2026-06-01",
      "2026-06-02",
    ]);
  });
});

describe("rejectRateTrend", () => {
  it("returns the last N days oldest→newest", () => {
    const trend = rejectRateTrend(rows, 2);
    expect(trend).toEqual([
      { date: "2026-06-01", total: 12, rejectRate: 0.5 },
      { date: "2026-06-02", total: 10, rejectRate: 0.2 },
    ]);
  });

  it("coerces missing numbers to zero", () => {
    const trend = rejectRateTrend([{ stat_date: "2026-06-02" }]);
    expect(trend).toEqual([{ date: "2026-06-02", total: 0, rejectRate: 0 }]);
  });
});

describe("latestStat", () => {
  it("returns the newest day", () => {
    expect(latestStat(rows)?.stat_date).toBe("2026-06-02");
  });

  it("returns null when empty", () => {
    expect(latestStat([])).toBeNull();
  });
});

describe("aggregateProductPassRates", () => {
  const withBreakdown: QcDailyStatRow[] = [
    {
      stat_date: "2026-06-01",
      by_product: {
        p1: { name: "Ginger", total: 4, reject: 1 },
        p2: { name: "Turmeric", total: 2, reject: 2 },
      },
    },
    {
      stat_date: "2026-06-02",
      by_product: { p1: { name: "Ginger", total: 6, reject: 2 } },
    },
  ];

  it("sums total/reject per product across days and derives pass rate", () => {
    const rates = aggregateProductPassRates(withBreakdown);
    const ginger = rates.find((r) => r.productId === "p1");
    expect(ginger).toMatchObject({
      productName: "Ginger",
      total: 10,
      reject: 3,
      pass: 7,
    });
    expect(ginger?.passRate).toBeCloseTo(0.7);
  });

  it("sorts by product name", () => {
    const rates = aggregateProductPassRates(withBreakdown);
    expect(rates.map((r) => r.productName)).toEqual(["Ginger", "Turmeric"]);
  });

  it("returns empty when no row carries a breakdown", () => {
    expect(aggregateProductPassRates([{ stat_date: "2026-06-02" }])).toEqual([]);
  });
});

describe("avgDeltaTrend", () => {
  it("keeps only days with a numeric avg, oldest→newest", () => {
    const trend = avgDeltaTrend([
      { stat_date: "2026-06-02", avg_delta_e: 3.2 },
      { stat_date: "2026-05-31", avg_delta_e: null },
      { stat_date: "2026-06-01", avg_delta_e: 1.5 },
    ]);
    expect(trend).toEqual([
      { date: "2026-06-01", avgDeltaE: 1.5 },
      { date: "2026-06-02", avgDeltaE: 3.2 },
    ]);
  });
});
