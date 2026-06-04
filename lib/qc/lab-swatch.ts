import chroma from "chroma-js";

export interface LabReferenceInput {
  ref_l?: unknown;
  ref_a?: unknown;
  ref_b?: unknown;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function labToHex(l: unknown, a: unknown, b: unknown): string | null {
  if (!isFiniteNumber(l) || !isFiniteNumber(a) || !isFiniteNumber(b)) {
    return null;
  }

  return chroma.lab(l, a, b).hex();
}

export function productReferenceHex(item: LabReferenceInput): string | null {
  return labToHex(item.ref_l, item.ref_a, item.ref_b);
}
