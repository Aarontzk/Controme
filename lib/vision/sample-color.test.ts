import { describe, expect, it } from "vitest";

import { evaluateSample, GINGER_POWDER } from "@/lib/domain";

import { analyzeSamplePixels, averageRgb, rgbToLab } from "./sample-color";

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

describe("analyzeSamplePixels", () => {
  it("averages powder-like pixels while excluding white tray pixels", () => {
    const pixels = new Uint8ClampedArray([
      245, 245, 245, 255,
      199, 161, 109, 255,
      201, 159, 111, 255,
      250, 250, 250, 255,
    ]);

    const result = analyzeSamplePixels(pixels, { minPowderPixels: 1 });

    expect(result.rgb).toEqual({ r: 200, g: 160, b: 110 });
    expect(result.metrics.powderPixels).toBe(2);
    expect(result.metrics.backgroundPixels).toBe(2);
  });

  it("flags dark foreign objects and excludes them from color averaging", () => {
    const pixels = new Uint8ClampedArray([
      199, 161, 109, 255,
      201, 159, 111, 255,
      20, 20, 18, 255,
      200, 160, 110, 255,
    ]);

    const result = analyzeSamplePixels(pixels, {
      minPowderPixels: 1,
      contaminationRatioMax: 0.2,
      minContaminantPixels: 1,
    });

    expect(result.rgb).toEqual({ r: 200, g: 160, b: 110 });
    expect(result.metrics.contaminantPixels).toBe(1);
    expect(result.contamination.status).toBe("reject");
  });

  it("warns when not enough powder pixels are available", () => {
    const pixels = new Uint8ClampedArray([
      245, 245, 245, 255,
      250, 250, 250, 255,
    ]);

    expect(() => analyzeSamplePixels(pixels, { minPowderPixels: 1 })).toThrow(
      "No powder pixels"
    );
  });

  it("passes consistency for uniform powder pixels", () => {
    const pixels = new Uint8ClampedArray([
      199, 161, 109, 255,
      201, 159, 111, 255,
      200, 160, 110, 255,
      198, 162, 108, 255,
    ]);

    const result = analyzeSamplePixels(pixels, { minPowderPixels: 1 });

    expect(result.consistency.status).toBe("pass");
    expect(result.metrics.brightnessStdDev).toBeLessThan(2);
  });

  it("rejects uneven texture when powder brightness varies too much", () => {
    const pixels = new Uint8ClampedArray([
      199, 161, 109, 255,
      140, 112, 72, 255,
      225, 185, 125, 255,
      198, 162, 108, 255,
    ]);

    const result = analyzeSamplePixels(pixels, {
      minPowderPixels: 1,
      textureStdDevMax: 18,
    });

    expect(result.consistency.status).toBe("reject");
    expect(result.metrics.brightnessStdDev).toBeGreaterThan(18);
  });
});
