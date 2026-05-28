import chroma from "chroma-js";

import type { LabColor, RgbColor } from "@/lib/domain";

export interface AverageRgbOptions {
  skipAlphaBelow?: number;
}

export type LaneStatus = "pass" | "reject";

export interface SampleAnalysisOptions extends AverageRgbOptions {
  minPowderPixels?: number;
  contaminationRatioMax?: number;
  minContaminantPixels?: number;
  textureStdDevMax?: number;
}

export interface SampleQualityMetrics {
  totalOpaquePixels: number;
  powderPixels: number;
  backgroundPixels: number;
  contaminantPixels: number;
  contaminantRatio: number;
  averageBrightness: number;
  brightnessStdDev: number;
  lightingWarnings: string[];
}

export interface ContaminationEvaluation {
  status: LaneStatus;
  contaminantPixels: number;
  contaminantRatio: number;
}

export interface ConsistencyEvaluation {
  status: LaneStatus;
  brightnessStdDev: number;
}

export interface SamplePixelAnalysis {
  rgb: RgbColor;
  metrics: SampleQualityMetrics;
  contamination: ContaminationEvaluation;
  consistency: ConsistencyEvaluation;
}

export function averageRgb(
  data: Uint8ClampedArray,
  opts: AverageRgbOptions = {}
): RgbColor {
  const alphaThreshold = opts.skipAlphaBelow ?? 16;
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let keptPixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 0;
    if (alpha < alphaThreshold) {
      continue;
    }

    redTotal += data[index] ?? 0;
    greenTotal += data[index + 1] ?? 0;
    blueTotal += data[index + 2] ?? 0;
    keptPixels += 1;
  }

  if (keptPixels === 0) {
    throw new Error("No opaque pixels found in sample region");
  }

  return {
    r: Math.round(redTotal / keptPixels),
    g: Math.round(greenTotal / keptPixels),
    b: Math.round(blueTotal / keptPixels),
  };
}

function getBrightness(r: number, g: number, b: number): number {
  return (r + g + b) / 3;
}

function isBackgroundPixel(r: number, g: number, b: number): boolean {
  const brightness = getBrightness(r, g, b);
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness >= 230 && spread <= 24;
}

function isContaminantPixel(r: number, g: number, b: number): boolean {
  const brightness = getBrightness(r, g, b);
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness <= 70 && spread <= 32;
}

function getLightingWarnings(averageBrightness: number): string[] {
  const warnings: string[] = [];
  if (averageBrightness < 80) {
    warnings.push("Sample appears under-lit; use softer, brighter lighting.");
  }
  if (averageBrightness > 215) {
    warnings.push("Sample appears over-lit; reduce highlights before measuring.");
  }
  return warnings;
}

export function analyzeSamplePixels(
  data: Uint8ClampedArray,
  opts: SampleAnalysisOptions = {}
): SamplePixelAnalysis {
  const alphaThreshold = opts.skipAlphaBelow ?? 16;
  const minPowderPixels = opts.minPowderPixels ?? 32;
  const contaminationRatioMax = opts.contaminationRatioMax ?? 0.025;
  const minContaminantPixels = opts.minContaminantPixels ?? 16;
  const textureStdDevMax = opts.textureStdDevMax ?? 26;
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let brightnessTotal = 0;
  let brightnessSquaredTotal = 0;
  let totalOpaquePixels = 0;
  let powderPixels = 0;
  let backgroundPixels = 0;
  let contaminantPixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 0;
    if (alpha < alphaThreshold) {
      continue;
    }

    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    totalOpaquePixels += 1;

    if (isBackgroundPixel(r, g, b)) {
      backgroundPixels += 1;
      continue;
    }

    if (isContaminantPixel(r, g, b)) {
      contaminantPixels += 1;
      continue;
    }

    redTotal += r;
    greenTotal += g;
    blueTotal += b;
    const brightness = getBrightness(r, g, b);
    brightnessTotal += brightness;
    brightnessSquaredTotal += brightness * brightness;
    powderPixels += 1;
  }

  if (powderPixels < minPowderPixels) {
    throw new Error("No powder pixels found in sample region");
  }

  const averageBrightness = brightnessTotal / powderPixels;
  const brightnessVariance = Math.max(
    0,
    brightnessSquaredTotal / powderPixels - averageBrightness * averageBrightness
  );
  const brightnessStdDev = Math.sqrt(brightnessVariance);
  const contaminantRatio =
    totalOpaquePixels === 0 ? 0 : contaminantPixels / totalOpaquePixels;
  const contaminationReject =
    contaminantPixels >= minContaminantPixels &&
    contaminantRatio > contaminationRatioMax;
  const consistencyReject = brightnessStdDev > textureStdDevMax;

  return {
    rgb: {
      r: Math.round(redTotal / powderPixels),
      g: Math.round(greenTotal / powderPixels),
      b: Math.round(blueTotal / powderPixels),
    },
    metrics: {
      totalOpaquePixels,
      powderPixels,
      backgroundPixels,
      contaminantPixels,
      contaminantRatio,
      averageBrightness,
      brightnessStdDev,
      lightingWarnings: getLightingWarnings(averageBrightness),
    },
    contamination: {
      status: contaminationReject ? "reject" : "pass",
      contaminantPixels,
      contaminantRatio,
    },
    consistency: {
      status: consistencyReject ? "reject" : "pass",
      brightnessStdDev,
    },
  };
}

export function rgbToLab(rgb: RgbColor): LabColor {
  const [L, a, b] = chroma(rgb.r, rgb.g, rgb.b).lab();
  return { L, a, b };
}
