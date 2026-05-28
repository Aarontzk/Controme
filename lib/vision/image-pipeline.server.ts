/**
 * Server-side, authoritative sample analysis. The browser preview is advisory; this is what a
 * persisted lot's ΔE/status is computed from, so a tampered client request can never forge a
 * verdict. Uses sharp to decode the uploaded photo, auto-orient from EXIF, and downscale.
 *
 * White balance is computed from the FULL frame (which includes the white tray/background, so
 * the gray-world assumption holds) and only then is the center ROI sliced out for measurement —
 * computing it from the powder-only ROI would drag a legitimately coloured powder toward gray.
 */

import "server-only";

import sharp from "sharp";

import type { LabColor, RgbColor } from "@/lib/domain";
import { getCenterRoi } from "./roi";
import {
  analyzeSamplePixels,
  rgbToLab,
  type SamplePixelAnalysis,
} from "./sample-color";
import { grayWorldWhiteBalance } from "./white-balance";

/** Cap the longest edge so analysis is fast and consistent across phone resolutions. */
export const MAX_IMAGE_DIMENSION = 1024;

export interface ServerSampleResult {
  lab: LabColor;
  rgb: RgbColor;
  analysis: SamplePixelAnalysis;
  imageWidth: number;
  imageHeight: number;
}

export interface AnalyzeImageOptions {
  /** Gray-world white balance (default true for uncontrolled phone captures). */
  whiteBalance?: boolean;
}

/** Copy the center ROI rows out of a full-frame RGBA buffer. */
function sliceRoi(
  full: Uint8ClampedArray,
  width: number,
  roi: { x: number; y: number; width: number; height: number }
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(roi.width * roi.height * 4);
  for (let y = 0; y < roi.height; y += 1) {
    const srcStart = ((roi.y + y) * width + roi.x) * 4;
    const destStart = y * roi.width * 4;
    out.set(full.subarray(srcStart, srcStart + roi.width * 4), destStart);
  }
  return out;
}

export async function analyzeSampleImage(
  buffer: Buffer,
  opts: AnalyzeImageOptions = {}
): Promise<ServerSampleResult> {
  const { data, info } = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (!info.width || !info.height) {
    throw new Error("Could not read image dimensions.");
  }

  const full = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  const balanced =
    opts.whiteBalance === false ? full : grayWorldWhiteBalance(full);

  const roi = getCenterRoi(info.width, info.height);
  const roiPixels = sliceRoi(balanced, info.width, roi);

  const analysis = analyzeSamplePixels(roiPixels, { width: roi.width });

  return {
    lab: rgbToLab(analysis.rgb),
    rgb: analysis.rgb,
    analysis,
    imageWidth: info.width,
    imageHeight: info.height,
  };
}
