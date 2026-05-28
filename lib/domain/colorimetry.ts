/**
 * Colorimetry primitives for Controme QC.
 *
 * Color quality is judged in the CIE L*a*b* space (perceptually uniform), comparing a
 * measured sample against a per-product reference. ΔE is the distance between two colors;
 * the larger it is, the more visibly different they are.
 */

/** A color in CIE L*a*b*. L = lightness (0–100), a = green→red, b = blue→yellow. */
export interface LabColor {
  L: number;
  a: number;
  b: number;
}

/** Approximate sRGB (0–255) — used only for UI preview swatches, not for QC math. */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** The three L*a*b* channels. */
export type LabChannel = "L" | "a" | "b";

/**
 * CIE76 ΔE — Euclidean distance between two L*a*b* colors.
 *
 * Simple, deterministic, and sufficient for spray-dried powder color QC (the PRD targets a
 * single ΔE threshold per product). Can be upgraded to CIEDE2000 later without changing the
 * evaluation contract.
 */
export function deltaE76(reference: LabColor, sample: LabColor): number {
  const dL = reference.L - sample.L;
  const da = reference.a - sample.a;
  const db = reference.b - sample.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/** Round to a fixed number of decimal places (default 2) for stable display/storage. */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
