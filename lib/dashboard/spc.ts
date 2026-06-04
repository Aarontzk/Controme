/**
 * Statistical Process Control (SPC) for QC ΔE — pure helpers.
 *
 * Extends the manager dashboard's ΔE trend (FR-04) into an early-warning view:
 * an individuals / moving-range (I-MR) control chart per product plus one-sided
 * process capability.
 *
 * Why one-sided: ΔE is a distance (≥ 0, smaller is better) with a single upper
 * spec limit (`delta_e_max`). A two-sided Cpk is statistically wrong here, so we
 * report **Cpu** = (USL − mean) / (3σ) and the simple "% within spec". σ is
 * estimated the I-MR way (mean moving range / d2) rather than the raw sample SD,
 * which is the standard for individual measurements.
 *
 * All functions are pure and operate on already-fetched rows — no backend object,
 * cron, or migration is involved.
 */

export interface SpcInputLot {
  id: string;
  product_id?: string | { id?: string; name?: string } | null;
  lot_code?: string | null;
  checked_at?: string | null;
  delta_e?: number | null;
}

export interface SpcProductRef {
  id: string;
  name?: string | null;
  delta_e_max?: number | null;
}

export interface SpcPoint {
  label: string;
  deltaE: number;
  beyondUcl: boolean;
  beyondUsl: boolean;
}

export type SpcViolationType = "beyond-ucl" | "out-of-spec" | "shift" | "drift";

export interface SpcViolation {
  type: SpcViolationType;
  message: string;
}

export type CapabilityVerdict =
  | "capable"
  | "marginal"
  | "not-capable"
  | "insufficient";

export interface SpcResult {
  productId: string;
  productName: string;
  n: number;
  mean: number;
  sigma: number;
  ucl: number;
  lcl: number;
  usl: number | null;
  cpu: number | null;
  pctInSpec: number;
  verdict: CapabilityVerdict;
  points: SpcPoint[];
  violations: SpcViolation[];
}

// Rolling window of most-recent lots per product, and the minimum points below
// which control limits / capability are not statistically meaningful.
export const SPC_WINDOW = 25;
export const SPC_MIN_POINTS = 8;

// d2 constant for a moving range of n = 2 (consecutive individuals).
const D2 = 1.128;
// Western Electric-style run lengths (simplified).
const SHIFT_RUN = 8; // consecutive points on one side of centre → process shift
const DRIFT_RUN = 6; // consecutive strictly increasing points → drift toward USL

function productInfo(value: SpcInputLot["product_id"]): {
  id: string;
  name: string;
} {
  if (!value) return { id: "unknown", name: "Unknown product" };
  if (typeof value === "string") return { id: value, name: value };
  return { id: value.id ?? "unknown", name: value.name ?? value.id ?? "Unknown product" };
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** σ estimated from the mean moving range (I-MR chart): MRbar / d2. */
function movingRangeSigma(values: readonly number[]): number {
  if (values.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < values.length; i += 1) {
    total += Math.abs(values[i] - values[i - 1]);
  }
  const mrBar = total / (values.length - 1);
  return mrBar / D2;
}

function longestRunAbove(values: readonly number[], centre: number): number {
  let best = 0;
  let run = 0;
  for (const v of values) {
    if (v > centre) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

function longestIncreasingRun(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[i - 1]) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

function verdictFor(
  n: number,
  sigma: number,
  meanValue: number,
  usl: number | null,
  cpu: number | null
): CapabilityVerdict {
  if (n < SPC_MIN_POINTS) return "insufficient";
  if (usl == null) return "insufficient";
  if (sigma <= 0) return meanValue <= usl ? "capable" : "not-capable";
  if (cpu == null) return "insufficient";
  if (cpu >= 1.33) return "capable";
  if (cpu >= 1.0) return "marginal";
  return "not-capable";
}

/** Build an SPC result for one product from its ordered ΔE points. */
export function buildSpcForProduct(
  productId: string,
  productName: string,
  labelled: ReadonlyArray<{ label: string; deltaE: number }>,
  usl: number | null
): SpcResult {
  const deltas = labelled.map((p) => p.deltaE);
  const n = deltas.length;
  const meanValue = mean(deltas);
  const sigma = movingRangeSigma(deltas);
  const ucl = meanValue + 3 * sigma;
  const lcl = Math.max(0, meanValue - 3 * sigma);
  const cpu = usl != null && sigma > 0 ? (usl - meanValue) / (3 * sigma) : null;
  const inSpec = usl == null ? n : deltas.filter((d) => d <= usl).length;
  const pctInSpec = n === 0 ? 0 : inSpec / n;

  const points: SpcPoint[] = labelled.map((p) => ({
    label: p.label,
    deltaE: p.deltaE,
    beyondUcl: sigma > 0 && p.deltaE > ucl,
    beyondUsl: usl != null && p.deltaE > usl,
  }));

  const violations: SpcViolation[] = [];
  if (n >= SPC_MIN_POINTS) {
    const beyondUcl = points.filter((p) => p.beyondUcl).length;
    if (beyondUcl > 0) {
      violations.push({
        type: "beyond-ucl",
        message: `${beyondUcl} titik di luar UCL — proses tak terkendali.`,
      });
    }
    const outOfSpec = points.filter((p) => p.beyondUsl).length;
    if (outOfSpec > 0) {
      violations.push({
        type: "out-of-spec",
        message: `${outOfSpec} titik di atas batas spec (ΔEmax) — reject.`,
      });
    }
    if (longestRunAbove(deltas, meanValue) >= SHIFT_RUN) {
      violations.push({
        type: "shift",
        message: `≥${SHIFT_RUN} titik berturut di atas rata-rata — indikasi pergeseran proses.`,
      });
    }
    if (longestIncreasingRun(deltas) >= DRIFT_RUN) {
      violations.push({
        type: "drift",
        message: `≥${DRIFT_RUN} titik naik beruntun — drift menuju batas spec (peringatan dini).`,
      });
    }
  }

  return {
    productId,
    productName,
    n,
    mean: meanValue,
    sigma,
    ucl,
    lcl,
    usl,
    cpu,
    pctInSpec,
    verdict: verdictFor(n, sigma, meanValue, usl, cpu),
    points,
    violations,
  };
}

/**
 * Group lots by product, take the most-recent `window` ΔE points (chronological),
 * and build an SPC result per product. Products are matched to their `delta_e_max`
 * (USL) by id. Sorted by product name.
 */
export function buildSpc(
  lots: readonly SpcInputLot[],
  products: readonly SpcProductRef[],
  window: number = SPC_WINDOW
): SpcResult[] {
  const uslById = new Map<string, number | null>();
  const nameById = new Map<string, string>();
  for (const p of products) {
    uslById.set(p.id, typeof p.delta_e_max === "number" ? p.delta_e_max : null);
    if (p.name) nameById.set(p.id, p.name);
  }

  const byProduct = new Map<
    string,
    { name: string; rows: SpcInputLot[] }
  >();
  for (const lot of lots) {
    if (typeof lot.delta_e !== "number" || !Number.isFinite(lot.delta_e)) continue;
    const info = productInfo(lot.product_id);
    const entry = byProduct.get(info.id) ?? { name: info.name, rows: [] };
    entry.rows.push(lot);
    byProduct.set(info.id, entry);
  }

  const results: SpcResult[] = [];
  for (const [productId, entry] of byProduct) {
    const ordered = [...entry.rows].sort((a, b) =>
      String(a.checked_at ?? "").localeCompare(String(b.checked_at ?? ""))
    );
    const windowed = ordered.slice(-window);
    const labelled = windowed.map((lot) => ({
      label: lot.lot_code || lot.id,
      deltaE: Number(lot.delta_e),
    }));
    const productName = nameById.get(productId) ?? entry.name;
    const usl = uslById.has(productId) ? uslById.get(productId)! : null;
    results.push(buildSpcForProduct(productId, productName, labelled, usl));
  }

  return results.sort((a, b) => a.productName.localeCompare(b.productName));
}

/** Human label + tone hint for a capability verdict. */
export function capabilityLabel(verdict: CapabilityVerdict): string {
  if (verdict === "capable") return "Capable (Cpu ≥ 1.33)";
  if (verdict === "marginal") return "Marginal (1.0 ≤ Cpu < 1.33)";
  if (verdict === "not-capable") return "Not capable (Cpu < 1.0)";
  return "Insufficient data";
}
