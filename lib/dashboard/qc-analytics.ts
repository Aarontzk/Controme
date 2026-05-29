export type LotStatus = "pass" | "reject";

export interface QcLotAnalyticsRow {
  id: string;
  product_id?: string | { id?: string; name?: string } | null;
  lot_code?: string | null;
  qc_stage?: "incoming" | "finish" | null;
  checked_at?: string | null;
  status?: LotStatus | null;
  warning_flag?: boolean | null;
  delta_e?: number | null;
  reject_reason?: string | null;
}

export interface ProductPassRate {
  productId: string;
  productName: string;
  total: number;
  pass: number;
  reject: number;
  passRate: number;
}

export interface TrendPoint {
  label: string;
  deltaE: number;
}

export interface ClearanceSummary {
  pending: number;
  cleared: number;
  rejected: number;
}

function productInfo(value: QcLotAnalyticsRow["product_id"]): {
  id: string;
  name: string;
} {
  if (!value) return { id: "unknown", name: "Unknown product" };
  if (typeof value === "string") return { id: value, name: value };
  return {
    id: value.id ?? "unknown",
    name: value.name ?? value.id ?? "Unknown product",
  };
}

export function aggregatePassRates(rows: QcLotAnalyticsRow[]): ProductPassRate[] {
  const byProduct = new Map<string, ProductPassRate>();

  for (const row of rows) {
    const product = productInfo(row.product_id);
    const current =
      byProduct.get(product.id) ??
      {
        productId: product.id,
        productName: product.name,
        total: 0,
        pass: 0,
        reject: 0,
        passRate: 0,
      };

    current.total += 1;
    if (row.status === "pass") current.pass += 1;
    if (row.status === "reject") current.reject += 1;
    current.passRate = current.total === 0 ? 0 : current.pass / current.total;
    byProduct.set(product.id, current);
  }

  return [...byProduct.values()].sort((a, b) =>
    a.productName.localeCompare(b.productName)
  );
}

export function buildDeltaTrend(rows: QcLotAnalyticsRow[], limit = 12): TrendPoint[] {
  return rows
    .filter((row) => typeof row.delta_e === "number")
    .sort((a, b) => String(a.checked_at ?? "").localeCompare(String(b.checked_at ?? "")))
    .slice(-limit)
    .map((row) => ({
      label: row.lot_code || row.id,
      deltaE: Number(row.delta_e),
    }));
}

export function summarizeClearance(rows: QcLotAnalyticsRow[]): ClearanceSummary {
  return rows.reduce<ClearanceSummary>(
    (summary, row) => {
      if (row.status === "pass") summary.cleared += 1;
      else if (row.status === "reject") summary.rejected += 1;
      else summary.pending += 1;
      return summary;
    },
    { pending: 0, cleared: 0, rejected: 0 }
  );
}

export function getRejectedOrWarning(rows: QcLotAnalyticsRow[]): QcLotAnalyticsRow[] {
  return rows
    .filter((row) => row.status === "reject" || row.warning_flag)
    .sort((a, b) => String(b.checked_at ?? "").localeCompare(String(a.checked_at ?? "")));
}
