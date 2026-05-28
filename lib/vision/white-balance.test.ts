import { describe, expect, it } from "vitest";

import { grayWorldWhiteBalance } from "./white-balance";

describe("grayWorldWhiteBalance", () => {
  it("does not mutate the input buffer", () => {
    const input = new Uint8ClampedArray([200, 150, 100, 255]);
    const copy = new Uint8ClampedArray(input);
    grayWorldWhiteBalance(input);
    expect(input).toEqual(copy);
  });

  it("neutralizes a uniform colour cast toward gray", () => {
    // Warm cast: every pixel skewed red, low blue.
    const input = new Uint8ClampedArray([
      200, 150, 100, 255,
      200, 150, 100, 255,
    ]);
    const out = grayWorldWhiteBalance(input);
    const spreadBefore = 200 - 100;
    const spreadAfter = Math.max(out[0], out[1], out[2]) - Math.min(out[0], out[1], out[2]);
    expect(spreadAfter).toBeLessThan(spreadBefore);
  });

  it("clamps gains so extreme casts are not over-corrected", () => {
    // Almost pure red — without clamping, green/blue gains would explode.
    const input = new Uint8ClampedArray([250, 5, 5, 255]);
    const out = grayWorldWhiteBalance(input, { maxGain: 1.6 });
    // Blue starts at 5; max gain 1.6 → at most 8, never near gray.
    expect(out[2]).toBeLessThanOrEqual(8);
  });

  it("leaves already-neutral pixels unchanged", () => {
    const input = new Uint8ClampedArray([128, 128, 128, 255]);
    const out = grayWorldWhiteBalance(input);
    expect([out[0], out[1], out[2]]).toEqual([128, 128, 128]);
  });

  it("preserves transparent pixels", () => {
    const input = new Uint8ClampedArray([200, 150, 100, 0]);
    const out = grayWorldWhiteBalance(input);
    expect([out[0], out[1], out[2], out[3]]).toEqual([200, 150, 100, 0]);
  });
});
