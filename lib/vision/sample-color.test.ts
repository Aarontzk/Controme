import { describe, expect, it } from "vitest";

import { evaluateSample, GINGER_POWDER } from "@/lib/domain";

import { averageRgb, rgbToLab } from "./sample-color";

describe("averageRgb", () => {
  it("averages opaque RGBA pixels into rounded sRGB channels", () => {
    const pixels = new Uint8ClampedArray([
      10, 20, 30, 255,
      30, 40, 50, 255,
      20, 30, 40, 255,
    ]);

    expect(averageRgb(pixels)).toEqual({ r: 20, g: 30, b: 40 });
  });

  it("skips transparent pixels below the alpha threshold", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 0,
      100, 120, 140, 255,
      200, 220, 240, 15,
    ]);

    expect(averageRgb(pixels)).toEqual({ r: 100, g: 120, b: 140 });
  });

  it("throws when all pixels are transparent", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 0,
      0, 255, 0, 8,
    ]);

    expect(() => averageRgb(pixels)).toThrow("No opaque pixels");
  });
});

describe("rgbToLab", () => {
  it("converts pure white sRGB close to CIE Lab white", () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });

    expect(lab.L).toBeCloseTo(100, 1);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it("feeds the domain QC evaluator without changing the pass/reject contract", () => {
    const lab = rgbToLab({ r: 199, g: 161, b: 109 });
    const result = evaluateSample(GINGER_POWDER, lab);

    expect(result.status).toBe("pass");
  });
});
