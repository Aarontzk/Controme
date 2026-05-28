import chroma from "chroma-js";

import type { LabColor, RgbColor } from "@/lib/domain";

export interface AverageRgbOptions {
  skipAlphaBelow?: number;
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

export function rgbToLab(rgb: RgbColor): LabColor {
  const [L, a, b] = chroma(rgb.r, rgb.g, rgb.b).lab();
  return { L, a, b };
}
