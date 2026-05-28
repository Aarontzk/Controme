/**
 * Region-of-interest helpers shared by the browser preview and the server-authoritative
 * recompute, so both measure the exact same area of a sample image.
 */

export interface RoiRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Default fraction of each dimension sampled from the image center. */
export const DEFAULT_ROI_FRACTION = 0.5;

/**
 * Center region of an image. Both client and server sample this same window so a saved lot's
 * server verdict matches what the operator previewed.
 */
export function getCenterRoi(
  width: number,
  height: number,
  fraction: number = DEFAULT_ROI_FRACTION
): RoiRect {
  const safeFraction = Math.min(1, Math.max(0.05, fraction));
  const roiWidth = Math.max(1, Math.floor(width * safeFraction));
  const roiHeight = Math.max(1, Math.floor(height * safeFraction));

  return {
    x: Math.floor((width - roiWidth) / 2),
    y: Math.floor((height - roiHeight) / 2),
    width: roiWidth,
    height: roiHeight,
  };
}
