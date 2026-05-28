/**
 * Map a DaaS `products` collection row to the domain `ProductReference` used by the QC
 * evaluator. Keeps the storage shape (flat ref_l/tol_l/...) decoupled from the domain shape
 * (nested reference/tolerance objects).
 */

import type { RgbColor } from "./colorimetry";
import type { ProductReference } from "./qc";

export interface DaasProductRow {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  ref_l: number;
  ref_a: number;
  ref_b: number;
  tol_l: number;
  tol_a: number;
  tol_b: number;
  delta_e_max: number;
  warning_margin?: number | null;
  rgb_approx?: string | null;
  active?: boolean;
}

function hexToRgb(hex: string | null | undefined): RgbColor | undefined {
  if (!hex) {
    return undefined;
  }
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return undefined;
  }
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
}

export function mapDaasProduct(row: DaasProductRow): ProductReference {
  const numbers = [
    row.ref_l,
    row.ref_a,
    row.ref_b,
    row.tol_l,
    row.tol_a,
    row.tol_b,
    row.delta_e_max,
  ];
  if (numbers.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error(`Product ${row.id} has incomplete colour reference data.`);
  }

  return {
    id: row.id,
    name: row.name,
    reference: { L: row.ref_l, a: row.ref_a, b: row.ref_b },
    tolerance: { L: row.tol_l, a: row.tol_a, b: row.tol_b },
    deltaEMax: row.delta_e_max,
    warningMargin: typeof row.warning_margin === "number" ? row.warning_margin : undefined,
    rgbApprox: hexToRgb(row.rgb_approx),
  };
}
