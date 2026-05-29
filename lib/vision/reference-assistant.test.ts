import { describe, expect, it } from "vitest";

import {
  clampRgbChannel,
  hexToRgb,
  mergeReferenceValues,
  referenceValuesFromRgb,
  rgbToHex,
  updateReferenceLimit,
} from "./reference-assistant";

describe("reference assistant helpers", () => {
  it("round-trips RGB and HEX values", () => {
    expect(rgbToHex({ r: 207, g: 162, b: 102 })).toBe("#CFA266");
    expect(hexToRgb("#CFA266")).toEqual({ r: 207, g: 162, b: 102 });
    expect(hexToRgb("c44a7a")).toEqual({ r: 196, g: 74, b: 122 });
  });

  it("clamps RGB channels to valid sRGB bounds", () => {
    expect(clampRgbChannel(-12)).toBe(0);
    expect(clampRgbChannel(127.6)).toBe(128);
    expect(clampRgbChannel(999)).toBe(255);
  });

  it("derives storage-ready reference values from RGB", () => {
    const values = referenceValuesFromRgb({ r: 207, g: 162, b: 102 });

    expect(values.rgb_approx).toBe("#CFA266");
    expect(values.ref_l).toBeGreaterThan(0);
    expect(values.ref_l).toBeLessThanOrEqual(100);
    expect(values.tol_l).toBe(4);
    expect(values.delta_e_max).toBe(5);
  });

  it("merges existing DaaS values while normalizing the color preview", () => {
    const values = mergeReferenceValues({
      ref_l: "70.25",
      ref_a: 8.5,
      ref_b: 33.1,
      tol_l: 3,
      rgb_approx: "cfa266",
      warning_margin: "0.2",
    });

    expect(values).toMatchObject({
      ref_l: 70.25,
      ref_a: 8.5,
      ref_b: 33.1,
      tol_l: 3,
      rgb_approx: "#CFA266",
      warning_margin: 0.2,
    });
  });

  it("keeps existing limits when an invalid numeric edit is received", () => {
    const values = referenceValuesFromRgb({ r: 196, g: 74, b: 122 });

    expect(updateReferenceLimit(values, "tol_a", "abc")).toBe(values);
    expect(updateReferenceLimit(values, "warning_margin", -1).warning_margin).toBe(0);
  });
});
