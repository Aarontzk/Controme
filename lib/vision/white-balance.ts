/**
 * Gray-world white balance for uncontrolled phone captures.
 *
 * Phone photos shift colour with ambient lighting (warm tungsten, cool shade), which would
 * bias ΔE. Gray-world assumes the average of a scene is neutral gray and rescales each channel
 * toward that gray. It is a heuristic — not a substitute for a white-reference card — so gains
 * are clamped to avoid over-correcting a legitimately tinted powder into a false pass.
 */

export interface WhiteBalanceOptions {
  /** Pixels with alpha below this are ignored (transparent padding). */
  skipAlphaBelow?: number;
  /** Clamp per-channel gain to [1/maxGain, maxGain] so correction stays conservative. */
  maxGain?: number;
}

/**
 * Return a new RGBA buffer with gray-world white balance applied. Input is not mutated.
 */
export function grayWorldWhiteBalance(
  data: Uint8ClampedArray,
  opts: WhiteBalanceOptions = {}
): Uint8ClampedArray {
  const alphaThreshold = opts.skipAlphaBelow ?? 16;
  const maxGain = opts.maxGain ?? 1.6;
  const minGain = 1 / maxGain;

  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let keptPixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    if ((data[index + 3] ?? 0) < alphaThreshold) {
      continue;
    }
    redTotal += data[index] ?? 0;
    greenTotal += data[index + 1] ?? 0;
    blueTotal += data[index + 2] ?? 0;
    keptPixels += 1;
  }

  const output = new Uint8ClampedArray(data);
  if (keptPixels === 0) {
    return output;
  }

  const meanR = redTotal / keptPixels;
  const meanG = greenTotal / keptPixels;
  const meanB = blueTotal / keptPixels;
  const gray = (meanR + meanG + meanB) / 3;

  const clampGain = (mean: number): number => {
    if (mean <= 0) {
      return 1;
    }
    return Math.min(maxGain, Math.max(minGain, gray / mean));
  };

  const gainR = clampGain(meanR);
  const gainG = clampGain(meanG);
  const gainB = clampGain(meanB);

  for (let index = 0; index < output.length; index += 4) {
    if ((output[index + 3] ?? 0) < alphaThreshold) {
      continue;
    }
    output[index] = Math.round((output[index] ?? 0) * gainR);
    output[index + 1] = Math.round((output[index + 1] ?? 0) * gainG);
    output[index + 2] = Math.round((output[index + 2] ?? 0) * gainB);
  }

  return output;
}
