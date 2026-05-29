import { round, type LabColor, type RgbColor } from "@/lib/domain";
import { rgbToLab } from "@/lib/vision/sample-color";

export interface ProductReferenceValues {
  ref_l: number;
  ref_a: number;
  ref_b: number;
  tol_l: number;
  tol_a: number;
  tol_b: number;
  delta_e_max: number;
  rgb_approx: string;
  warning_margin: number;
}

export const DEFAULT_REFERENCE_RGB: RgbColor = { r: 207, g: 162, b: 102 };

export const DEFAULT_REFERENCE_LIMITS = {
  tol_l: 4,
  tol_a: 2,
  tol_b: 3.5,
  delta_e_max: 5,
  warning_margin: 0.1,
} as const;

function asFiniteNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function clampRgbChannel(value: unknown): number {
  const parsed = asFiniteNumber(value) ?? 0;
  return Math.min(255, Math.max(0, Math.round(parsed)));
}

export function rgbToHex(rgb: RgbColor): string {
  const toHex = (value: number) => clampRgbChannel(value).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

export function hexToRgb(hex: string | null | undefined): RgbColor | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? "");
  if (!match) {
    return null;
  }
  const value = parseInt(match[1], 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

export function labFromRgb(rgb: RgbColor): LabColor {
  const lab = rgbToLab(rgb);
  return {
    L: round(lab.L),
    a: round(lab.a),
    b: round(lab.b),
  };
}

export function referenceValuesFromRgb(
  rgb: RgbColor,
  overrides: Partial<ProductReferenceValues> = {}
): ProductReferenceValues {
  const lab = labFromRgb(rgb);
  return {
    ref_l: lab.L,
    ref_a: lab.a,
    ref_b: lab.b,
    tol_l: overrides.tol_l ?? DEFAULT_REFERENCE_LIMITS.tol_l,
    tol_a: overrides.tol_a ?? DEFAULT_REFERENCE_LIMITS.tol_a,
    tol_b: overrides.tol_b ?? DEFAULT_REFERENCE_LIMITS.tol_b,
    delta_e_max: overrides.delta_e_max ?? DEFAULT_REFERENCE_LIMITS.delta_e_max,
    rgb_approx: rgbToHex(rgb),
    warning_margin: overrides.warning_margin ?? DEFAULT_REFERENCE_LIMITS.warning_margin,
  };
}

export const DEFAULT_PRODUCT_REFERENCE_VALUES =
  referenceValuesFromRgb(DEFAULT_REFERENCE_RGB);

export function mergeReferenceValues(
  source: Partial<Record<keyof ProductReferenceValues, unknown>>,
  fallback: ProductReferenceValues = DEFAULT_PRODUCT_REFERENCE_VALUES
): ProductReferenceValues {
  const rgb = hexToRgb(String(source.rgb_approx ?? fallback.rgb_approx)) ?? DEFAULT_REFERENCE_RGB;
  const generated = referenceValuesFromRgb(rgb, fallback);

  return {
    ref_l: asFiniteNumber(source.ref_l) ?? generated.ref_l,
    ref_a: asFiniteNumber(source.ref_a) ?? generated.ref_a,
    ref_b: asFiniteNumber(source.ref_b) ?? generated.ref_b,
    tol_l: asFiniteNumber(source.tol_l) ?? generated.tol_l,
    tol_a: asFiniteNumber(source.tol_a) ?? generated.tol_a,
    tol_b: asFiniteNumber(source.tol_b) ?? generated.tol_b,
    delta_e_max: asFiniteNumber(source.delta_e_max) ?? generated.delta_e_max,
    rgb_approx: rgbToHex(rgb),
    warning_margin: asFiniteNumber(source.warning_margin) ?? generated.warning_margin,
  };
}

export function updateReferenceLimit(
  values: ProductReferenceValues,
  field: "tol_l" | "tol_a" | "tol_b" | "delta_e_max" | "warning_margin",
  value: unknown
): ProductReferenceValues {
  const parsed = asFiniteNumber(value);
  if (parsed === undefined) {
    return values;
  }
  const minimum = field === "warning_margin" ? 0 : 0.01;
  return {
    ...values,
    [field]: Math.max(minimum, parsed),
  };
}
