import chroma from "chroma-js";

import type { LabColor, RgbColor } from "@/lib/domain";
import { grayWorldWhiteBalance } from "./white-balance";

export interface AverageRgbOptions {
  skipAlphaBelow?: number;
  /** Apply gray-world white balance before averaging (uncontrolled lighting). */
  whiteBalance?: boolean;
}

/** sRGB 0–255 channel → linear-light 0–1. */
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Linear-light 0–1 → sRGB 0–255 (rounded). */
function linearToSrgb(channel: number): number {
  const c = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

export type LaneStatus = "pass" | "reject";

export interface SampleAnalysisOptions extends AverageRgbOptions {
  minPowderPixels?: number;
  contaminationRatioMax?: number;
  minContaminantPixels?: number;
  width?: number;
  textureStdDevMax?: number;
  textureContrastMax?: number;
  /** A pixel is a foreign object when its brightness is below this fraction of the powder mean. */
  contaminantRelativeDark?: number;
  /** Reject when the largest contiguous foreign-object blob exceeds this fraction of the ROI. */
  contaminantBlobRatioMax?: number;
  /** Absolute floor (pixels) for the blob reject, so noise on small images is ignored. */
  minContaminantBlobPixels?: number;
}

export interface SampleQualityMetrics {
  totalOpaquePixels: number;
  powderPixels: number;
  backgroundPixels: number;
  contaminantPixels: number;
  contaminantRatio: number;
  /** Size (pixels) of the largest contiguous foreign-object region in the ROI. */
  largestContaminantBlob: number;
  averageBrightness: number;
  brightnessStdDev: number;
  textureContrast: number;
  lightingWarnings: string[];
}

export interface ContaminationEvaluation {
  status: LaneStatus;
  contaminantPixels: number;
  contaminantRatio: number;
  largestBlob: number;
}

export interface ConsistencyEvaluation {
  status: LaneStatus;
  brightnessStdDev: number;
  textureContrast: number;
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
  const pixels = opts.whiteBalance
    ? grayWorldWhiteBalance(data, { skipAlphaBelow: alphaThreshold })
    : data;

  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let keptPixels = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;
    if (alpha < alphaThreshold) {
      continue;
    }

    redTotal += srgbToLinear(pixels[index] ?? 0);
    greenTotal += srgbToLinear(pixels[index + 1] ?? 0);
    blueTotal += srgbToLinear(pixels[index + 2] ?? 0);
    keptPixels += 1;
  }

  if (keptPixels === 0) {
    throw new Error("No opaque pixels found in sample region");
  }

  return {
    r: linearToSrgb(redTotal / keptPixels),
    g: linearToSrgb(greenTotal / keptPixels),
    b: linearToSrgb(blueTotal / keptPixels),
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

/**
 * Largest contiguous (4-connectivity) run of flagged pixels. A single localized foreign object
 * (a stone, a chip) forms one big blob even when it is a tiny fraction of the whole ROI, so blob
 * size catches it where a global contaminant ratio does not.
 */
function largestContaminantBlob(
  mask: Uint8Array,
  width: number
): number {
  if (width <= 0) {
    return 0;
  }
  const height = Math.floor(mask.length / width);
  const visited = new Uint8Array(mask.length);
  const stack: number[] = [];
  let largest = 0;

  for (let start = 0; start < mask.length; start += 1) {
    if (mask[start] !== 1 || visited[start] === 1) {
      continue;
    }
    let size = 0;
    stack.push(start);
    visited[start] = 1;
    while (stack.length > 0) {
      const index = stack.pop() as number;
      size += 1;
      const x = index % width;
      const y = (index - x) / width;
      if (x + 1 < width && mask[index + 1] === 1 && visited[index + 1] === 0) {
        visited[index + 1] = 1;
        stack.push(index + 1);
      }
      if (x - 1 >= 0 && mask[index - 1] === 1 && visited[index - 1] === 0) {
        visited[index - 1] = 1;
        stack.push(index - 1);
      }
      if (y + 1 < height && mask[index + width] === 1 && visited[index + width] === 0) {
        visited[index + width] = 1;
        stack.push(index + width);
      }
      if (y - 1 >= 0 && mask[index - width] === 1 && visited[index - width] === 0) {
        visited[index - width] = 1;
        stack.push(index - width);
      }
    }
    if (size > largest) {
      largest = size;
    }
  }

  return largest;
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

function getTextureContrast(
  powderBrightness: Float64Array | null,
  width: number | undefined
): number {
  if (!powderBrightness || !width || width <= 0) {
    return 0;
  }

  const height = Math.floor(powderBrightness.length / width);
  let diffTotal = 0;
  let diffCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const brightness = powderBrightness[index];
      if (!Number.isFinite(brightness)) {
        continue;
      }

      if (x + 1 < width) {
        const right = powderBrightness[index + 1];
        if (Number.isFinite(right)) {
          diffTotal += Math.abs(brightness - right);
          diffCount += 1;
        }
      }

      if (y + 1 < height) {
        const below = powderBrightness[index + width];
        if (Number.isFinite(below)) {
          diffTotal += Math.abs(brightness - below);
          diffCount += 1;
        }
      }
    }
  }

  return diffCount === 0 ? 0 : diffTotal / diffCount;
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
  const textureContrastMax = opts.textureContrastMax ?? 18;
  const contaminantRelativeDark = opts.contaminantRelativeDark ?? 0.6;
  const contaminantBlobRatioMax = opts.contaminantBlobRatioMax ?? 0.0008;
  const minContaminantBlobPixels = opts.minContaminantBlobPixels ?? 24;
  const pixels = opts.whiteBalance
    ? grayWorldWhiteBalance(data, { skipAlphaBelow: alphaThreshold })
    : data;
  const pixelCount = Math.floor(pixels.length / 4);
  const powderBrightness = opts.width
    ? new Float64Array(pixelCount).fill(Number.NaN)
    : null;
  const contaminantMask = opts.width ? new Uint8Array(pixelCount) : null;

  // Pass 1: separate background from sample pixels and find the mean sample brightness, so a
  // foreign object can be detected relative to the powder (works for light and dark powders).
  let nonBackgroundBrightnessTotal = 0;
  let nonBackgroundPixels = 0;
  let totalOpaquePixels = 0;
  let backgroundPixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if ((pixels[index + 3] ?? 0) < alphaThreshold) {
      continue;
    }
    totalOpaquePixels += 1;
    const r = pixels[index] ?? 0;
    const g = pixels[index + 1] ?? 0;
    const b = pixels[index + 2] ?? 0;
    if (isBackgroundPixel(r, g, b)) {
      backgroundPixels += 1;
      continue;
    }
    nonBackgroundBrightnessTotal += getBrightness(r, g, b);
    nonBackgroundPixels += 1;
  }

  const meanNonBackground =
    nonBackgroundPixels === 0 ? 0 : nonBackgroundBrightnessTotal / nonBackgroundPixels;
  const darkCutoff = meanNonBackground * contaminantRelativeDark;

  // Pass 2: classify each sample pixel as foreign object (much darker than the powder) or powder,
  // accumulating powder colour in linear light and texture stats.
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let brightnessTotal = 0;
  let brightnessSquaredTotal = 0;
  let powderPixels = 0;
  let contaminantPixels = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    if ((pixels[index + 3] ?? 0) < alphaThreshold) {
      continue;
    }
    const r = pixels[index] ?? 0;
    const g = pixels[index + 1] ?? 0;
    const b = pixels[index + 2] ?? 0;
    if (isBackgroundPixel(r, g, b)) {
      continue;
    }

    const brightness = getBrightness(r, g, b);
    if (brightness <= darkCutoff) {
      contaminantPixels += 1;
      if (contaminantMask) {
        contaminantMask[index / 4] = 1;
      }
      continue;
    }

    redTotal += srgbToLinear(r);
    greenTotal += srgbToLinear(g);
    blueTotal += srgbToLinear(b);
    brightnessTotal += brightness;
    brightnessSquaredTotal += brightness * brightness;
    if (powderBrightness) {
      powderBrightness[index / 4] = brightness;
    }
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
  const textureContrast = getTextureContrast(powderBrightness, opts.width);
  const largestBlob =
    contaminantMask && opts.width
      ? largestContaminantBlob(contaminantMask, opts.width)
      : 0;
  const blobThreshold = Math.max(
    minContaminantBlobPixels,
    contaminantBlobRatioMax * totalOpaquePixels
  );
  const scatteredReject =
    contaminantPixels >= minContaminantPixels &&
    contaminantRatio > contaminationRatioMax;
  const blobReject = largestBlob >= blobThreshold;
  const contaminationReject = scatteredReject || blobReject;
  const consistencyReject =
    brightnessStdDev > textureStdDevMax ||
    textureContrast > textureContrastMax;

  return {
    rgb: {
      r: linearToSrgb(redTotal / powderPixels),
      g: linearToSrgb(greenTotal / powderPixels),
      b: linearToSrgb(blueTotal / powderPixels),
    },
    metrics: {
      totalOpaquePixels,
      powderPixels,
      backgroundPixels,
      contaminantPixels,
      contaminantRatio,
      largestContaminantBlob: largestBlob,
      averageBrightness,
      brightnessStdDev,
      textureContrast,
      lightingWarnings: getLightingWarnings(averageBrightness),
    },
    contamination: {
      status: contaminationReject ? "reject" : "pass",
      contaminantPixels,
      contaminantRatio,
      largestBlob,
    },
    consistency: {
      status: consistencyReject ? "reject" : "pass",
      brightnessStdDev,
      textureContrast,
    },
  };
}

export function rgbToLab(rgb: RgbColor): LabColor {
  const [L, a, b] = chroma(rgb.r, rgb.g, rgb.b).lab();
  return { L, a, b };
}
