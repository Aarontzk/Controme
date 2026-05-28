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
    expect(result.channelFlags).toHaveLength(0);
  });

  it("passes a small in-tolerance deviation", () => {
    const result = evaluateSample(GINGER_POWDER, { L: 70, a: 10, b: 38 });
    expect(result.status).toBe("pass");
    expect(result.deltaE).toBeLessThanOrEqual(GINGER_POWDER.deltaEMax);
    expect(result.channelFlags).toHaveLength(0);
  });

  it("rejects an over-heated (too dark) ginger lot and flags L low", () => {
    const result = evaluateSample(GINGER_POWDER, {
      L: 60,
      a: GINGER_POWDER.reference.a,
      b: GINGER_POWDER.reference.b,
    });
    expect(result.status).toBe("reject");
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

  it("marks pass results inside the warning band", () => {
    const result = evaluateSample(DRAGON_FRUIT_POWDER, {
      L: DRAGON_FRUIT_POWDER.reference.L + 4.1,
      a: DRAGON_FRUIT_POWDER.reference.a,
      b: DRAGON_FRUIT_POWDER.reference.b,
    });
    expect(result.status).toBe("pass");
    expect(result.warningFlag).toBe(true);
    expect(isWarningBand(DRAGON_FRUIT_POWDER, 4.05)).toBe(false);
    expect(isWarningBand(DRAGON_FRUIT_POWDER, 4.06)).toBe(true);
    expect(isWarningBand(DRAGON_FRUIT_POWDER, 4.51)).toBe(false);
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
