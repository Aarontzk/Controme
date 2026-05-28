/**
 * Demo product references for Controme (PRD §4.1–4.2). These seed the `products` collection
 * and back the prototype demo. Values are food-grade colorimetry references with per-channel
 * tolerances and a ΔE reject threshold.
 */

import type { ProductReference } from "./qc";

/** Spray-Dried Ginger Powder — warm beige-brown; darkening = over-heated, fading = stale. */
export const GINGER_POWDER: ProductReference = {
  id: "ginger-spray-dried",
  name: "Spray-Dried Ginger Powder",
  reference: {
    L: 69.51783137071644,
    a: 9.34119933738592,
    b: 37.396043799462376,
  },
  tolerance: { L: 4.0, a: 2.0, b: 3.5 },
  deltaEMax: 5.0,
  rgbApprox: { r: 207, g: 162, b: 102 },
};

/** Dragon Fruit Powder — bright red-pink (betacyanin); oxidation shifts it dramatically. */
export const DRAGON_FRUIT_POWDER: ProductReference = {
  id: "dragon-fruit-powder",
  name: "Dragon Fruit Powder",
  reference: { L: 45.0, a: 38.6, b: -8.3 },
  tolerance: { L: 3.5, a: 4.0, b: 2.5 },
  deltaEMax: 4.5,
  rgbApprox: { r: 196, g: 74, b: 122 },
};

export const REFERENCE_PRODUCTS: readonly ProductReference[] = [
  GINGER_POWDER,
  DRAGON_FRUIT_POWDER,
];
