import { describe, expect, it } from "vitest";

import { deltaE76 } from "./colorimetry";
import { buildQCLot, evaluateSample, isWarningBand } from "./qc";
import { DRAGON_FRUIT_POWDER, GINGER_POWDER } from "./reference-products";

describe("deltaE76", () => {
  it("is 0 for identical colors", () => {
    expect(deltaE76({ L: 50, a: 10, b: -5 }, { L: 50, a: 10, b: -5 })).toBe(0);
  });

  it("equals the single-channel delta when only one channel differs", () => {
    expect(deltaE76({ L: 68.5, a: 7.2, b: 32.4 }, { L: 60, a: 7.2, b: 32.4 })).toBeCloseTo(8.5, 5);
  });

  it("is the Euclidean distance across channels (3-4-5 triangle)", () => {
    expect(deltaE76({ L: 0, a: 0, b: 0 }, { L: 3, a: 4, b: 0 })).toBe(5);
  });
});

describe("evaluateSample", () => {
  it("passes the exact reference color with no channel flags", () => {
    const result = evaluateSample(GINGER_POWDER, GINGER_POWDER.reference);
    expect(result.deltaE).toBe(0);
    expect(result.status).toBe("pass");
    expect(result.warningFlag).toBe(false);
    expect(result.channelFlags).toHaveLength(0);
  });

  it("passes a small in-tolerance deviation", () => {
    const result = evaluateSample(GINGER_POWDER, { L: 70, a: 10, b: 38 });
    expect(result.status).toBe("pass");
    expect(result.deltaE).toBeLessThanOrEqual(GINGER_POWDER.deltaEMax);
    expect(result.warningFlag).toBe(false);
    expect(result.channelFlags).toHaveLength(0);
  });

  it("rejects an over-heated (too dark) ginger lot and flags L low", () => {
    const result = evaluateSample(GINGER_POWDER, {
      L: 60,
      a: GINGER_POWDER.reference.a,
      b: GINGER_POWDER.reference.b,
    });
    expect(result.status).toBe("reject");
    expect(result.warningFlag).toBe(false);
    expect(result.channelFlags).toEqual([
      {
        channel: "L",
        value: 60,
        reference: GINGER_POWDER.reference.L,
        tolerance: 4.0,
        direction: "low",
      },
    ]);
  });

  it("rejects an oxidized dragon fruit lot (a* down, b* shifted blue)", () => {
    const result = evaluateSample(DRAGON_FRUIT_POWDER, { L: 45, a: 30, b: -12 });
    expect(result.status).toBe("reject"); // ΔE ~9.6 > 4.5
    const channels = result.channelFlags.map((f) => f.channel);
    expect(channels).toContain("a"); // 30 < 38.6 - 4.0
    expect(channels).toContain("b"); // -12 < -8.3 - 2.5
  });

  it("can flag a channel while still passing on ΔE (borderline)", () => {
    // a* just outside ±2.0 tolerance, but overall ΔE stays under 5.0 → pass + flag.
    const result = evaluateSample(GINGER_POWDER, {
      L: GINGER_POWDER.reference.L,
      a: GINGER_POWDER.reference.a + 2.3,
      b: GINGER_POWDER.reference.b,
    });
    expect(result.status).toBe("pass");
    expect(result.channelFlags.map((f) => f.channel)).toEqual(["a"]);
  });
});

describe("isWarningBand", () => {
  it("is true only for passing lots above 90 percent of the threshold", () => {
    expect(isWarningBand(4.51, 5)).toBe(true);
    expect(isWarningBand(5, 5)).toBe(true);
    expect(isWarningBand(4.5, 5)).toBe(false);
    expect(isWarningBand(5.01, 5)).toBe(false);
  });
});

describe("buildQCLot", () => {
  it("copies ΔE and status from the evaluation so they cannot drift", () => {
    const measured = {
      L: 60,
      a: GINGER_POWDER.reference.a,
      b: GINGER_POWDER.reference.b,
    };
    const evaluation = evaluateSample(GINGER_POWDER, measured);
    const lot = buildQCLot({
      lotId: "LOT-001",
      productId: GINGER_POWDER.id,
      measured,
      evaluation,
      photoUrl: "https://example.test/lot-001.jpg",
      operatorId: "user-rudi",
      timestamp: "2026-05-27T08:00:00.000Z",
    });
    expect(lot).toEqual({
      lotId: "LOT-001",
      productId: "ginger-spray-dried",
      timestamp: "2026-05-27T08:00:00.000Z",
      measured,
      deltaE: evaluation.deltaE,
      status: "reject",
      photoUrl: "https://example.test/lot-001.jpg",
      operatorId: "user-rudi",
    });
  });
});
