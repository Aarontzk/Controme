import { describe, expect, it } from "vitest";

import {
  labToHex,
  productReferenceHex,
  productReferenceLabLabel
} from "./lab-swatch";

describe("labToHex", () => {
  it("converts CIE Lab values to hex colors", () => {
    expect(labToHex(100, 0, 0)).toBe("#ffffff");
    expect(labToHex(0, 0, 0)).toBe("#000000");
    expect(labToHex(50, 0, 0)).toBe("#777777");
  });

  it("converts the seeded ginger reference Lab to its expected swatch", () => {
    expect(
      labToHex(69.51783137071644, 9.34119933738592, 37.396043799462376)
    ).toBe("#cfa266");
  });

  it("returns null for incomplete or non-finite Lab values", () => {
    expect(labToHex(null, 0, 0)).toBeNull();
    expect(labToHex(50, undefined, 0)).toBeNull();
    expect(labToHex(50, 0, Number.NaN)).toBeNull();
    expect(labToHex("50", 0, 0)).toBeNull();
  });
});

describe("productReferenceHex", () => {
  it("reads product reference Lab fields from a DaaS item", () => {
    expect(
      productReferenceHex({
        ref_l: 69.51783137071644,
        ref_a: 9.34119933738592,
        ref_b: 37.396043799462376
      })
    ).toBe("#cfa266");
  });

  it("returns null when any reference channel is missing", () => {
    expect(productReferenceHex({ ref_l: 69, ref_a: 9 })).toBeNull();
  });
});

describe("productReferenceLabLabel", () => {
  it("formats the reference Lab triplet for UI tooltips", () => {
    expect(
      productReferenceLabLabel({
        ref_l: 69.51783137071644,
        ref_a: 9.34119933738592,
        ref_b: 37.396043799462376
      })
    ).toBe("L 69.52, a 9.34, b 37.40");
  });

  it("returns null when any reference channel is missing", () => {
    expect(productReferenceLabLabel({ ref_l: 69, ref_a: 9 })).toBeNull();
  });
});
