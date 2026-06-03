/**
 * Pure helpers for the precomputed QC daily-stats strip.
 *
 * The `qc-daily-stats` cron writes one `qc_daily_stats` row per day (a rollup of
 * that day's qc_lots) so the manager dashboard can render KPI history without
 * scanning every lot. This module orders rows, derives a compact reject-rate
 * trend, and exposes the most recent day.
 */

export interface ProductByDay {
  name?: string | null;
  total?: number | null;
  reject?: number | null;
}

export interface QcDailyStatRow {
  stat_date?: string | null; // YYYY-MM-DD
  total_lots?: number | null;
  reject_count?: number | null;
  reject_rate?: number | null; // 0..1
  warning_count?: number | null;
  avg_delta_e?: number | null;
  by_product?: Record<string, ProductByDay> | null;
}

export interface DailyStatPoint {
  date: string;
  total: number;
  rejectRate: number; // 0..1
}

export interface ProductRollup {
  productId: string;
  productName: string;
  total: number;
  pass: number;
  reject: number;
  passRate: number; // 0..1
}

export interface AvgDeltaPoint {
  date: string;
  avgDeltaE: number;
}

/** Rows oldest→newest by `stat_date` (drops rows without a date). */
export function orderByDate(rows: readonly QcDailyStatRow[]): QcDailyStatRow[] {
  return [...rows]
    .filter((row) => Boolean(row.stat_date))
    .sort((a, b) => String(a.stat_date).localeCompare(String(b.stat_date)));
}

/** The last `limit` days as compact trend points (oldest→newest). */
export function rejectRateTrend(
  rows: readonly QcDailyStatRow[],
  limit = 14
): DailyStatPoint[] {
  return orderByDate(rows)
    .slice(-limit)
    .map((row) => ({
      date: String(row.stat_date),
      total: Number(row.total_lots ?? 0),
      rejectRate: Number(row.reject_rate ?? 0),
    }));
}

/** Newest day's row, or null when there are none. */
export function latestStat(
  rows: readonly QcDailyStatRow[]
): QcDailyStatRow | null {
  const ordered = orderByDate(rows);
  return ordered.length ? ordered[ordered.length - 1] : null;
}

/**
 * Per-product pass rates summed across the supplied daily rows' `by_product`
 * breakdown — the precomputed equivalent of scanning every lot. Sorted by
 * product name. Returns an empty array when no row carries a breakdown (the
 * caller can then fall back to a live computation).
 */
export function aggregateProductPassRates(
  rows: readonly QcDailyStatRow[]
): ProductRollup[] {
  const byProduct = new Map<string, ProductRollup>();

  for (const row of rows) {
    const breakdown = row.by_product;
    if (!breakdown) continue;
    for (const [productId, value] of Object.entries(breakdown)) {
      const current =
        byProduct.get(productId) ??
        {
          productId,
          productName: value?.name ?? productId,
          total: 0,
          pass: 0,
          reject: 0,
          passRate: 0,
        };
      current.total += Number(value?.total ?? 0);
      current.reject += Number(value?.reject ?? 0);
      if (value?.name) current.productName = value.name;
      byProduct.set(productId, current);
    }
  }

  for (const rollup of byProduct.values()) {
    rollup.pass = Math.max(0, rollup.total - rollup.reject);
    rollup.passRate = rollup.total === 0 ? 0 : rollup.pass / rollup.total;
  }

  return [...byProduct.values()].sort((a, b) =>
    a.productName.localeCompare(b.productName)
  );
}

/** Per-day average ΔE points (last `limit` days, oldest→newest). */
export function avgDeltaTrend(
  rows: readonly QcDailyStatRow[],
  limit = 14
): AvgDeltaPoint[] {
  return orderByDate(rows)
    .filter((row) => typeof row.avg_delta_e === "number")
    .slice(-limit)
    .map((row) => ({
      date: String(row.stat_date),
      avgDeltaE: Number(row.avg_delta_e),
    }));
}
