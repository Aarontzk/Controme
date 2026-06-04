import { describe, expect, it } from "vitest";

import {
  buildSpc,
  buildSpcForProduct,
  capabilityLabel,
  SPC_MIN_POINTS,
  type SpcInputLot,
  type SpcProductRef,
} from "./spc";

function labelled(values: number[]) {
  return values.map((deltaE, i) => ({ label: `L${i}`, deltaE }));
}

describe("buildSpcForProduct", () => {
  it("computes mean, I-MR sigma, UCL, Cpu and % in spec", () => {
    const r = buildSpcForProduct(
      "p1",
      "Ginger",
      labelled([2, 3, 2, 4, 3, 5, 4, 6]),
      5
    );
    expect(r.n).toBe(8);
    expect(r.mean).toBeCloseTo(3.625, 3);
    expect(r.sigma).toBeCloseTo(1.2665, 3); // (10/7)/1.128
    expect(r.ucl).toBeCloseTo(7.4244, 2);
    expect(r.cpu).toBeCloseTo(0.3619, 3); // (5-3.625)/(3*sigma)
    expect(r.pctInSpec).toBeCloseTo(0.875, 5);
    expect(r.verdict).toBe("not-capable");
  });

  it("flags out-of-spec points above USL", () => {
    const r = buildSpcForProduct("p1", "Ginger", labelled([2, 3, 2, 4, 3, 5, 4, 6]), 5);
    expect(r.violations.some((v) => v.type === "out-of-spec")).toBe(true);
  });

  it("rates a tight, well-centred process as capable", () => {
    const r = buildSpcForProduct(
      "p1",
      "Ginger",
      labelled([1, 1.1, 0.9, 1.0, 1.05, 0.95, 1.0, 1.02]),
      5
    );
    expect(r.verdict).toBe("capable");
    expect(r.cpu ?? 0).toBeGreaterThan(1.33);
  });

  it("detects an upward drift as an early-warning violation", () => {
    const r = buildSpcForProduct(
      "p1",
      "Ginger",
      labelled([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.4]),
      5
    );
    expect(r.violations.some((v) => v.type === "drift")).toBe(true);
  });

  it("returns an insufficient verdict below the minimum point count", () => {
    const r = buildSpcForProduct("p1", "Ginger", labelled([1, 2, 3, 4, 5]), 5);
    expect(r.n).toBeLessThan(SPC_MIN_POINTS);
    expect(r.verdict).toBe("insufficient");
    expect(r.violations).toHaveLength(0);
  });
});

describe("buildSpc", () => {
  const products: SpcProductRef[] = [
    { id: "p1", name: "Ginger", delta_e_max: 5 },
    { id: "p2", name: "Dragon Fruit", delta_e_max: 4.5 },
  ];

  function lot(
    id: string,
    productId: string,
    deltaE: number,
    checkedAt: string
  ): SpcInputLot {
    return { id, product_id: productId, delta_e: deltaE, checked_at: checkedAt };
  }

  it("groups by product, takes the most-recent window, sorts by name", () => {
    const lots: SpcInputLot[] = [
      lot("a", "p1", 1, "2026-06-01T00:00:00Z"),
      lot("b", "p1", 2, "2026-06-02T00:00:00Z"),
      lot("c", "p1", 3, "2026-06-03T00:00:00Z"),
      lot("d", "p1", 4, "2026-06-04T00:00:00Z"),
      lot("e", "p2", 9, "2026-06-01T00:00:00Z"),
    ];
    const results = buildSpc(lots, products, 3);
    expect(results.map((r) => r.productName)).toEqual(["Dragon Fruit", "Ginger"]);
    const ginger = results.find((r) => r.productId === "p1");
    expect(ginger?.n).toBe(3); // windowed to last 3 by checked_at
    expect(ginger?.points.map((p) => p.deltaE)).toEqual([2, 3, 4]);
    expect(ginger?.usl).toBe(5);
  });

  it("ignores rows with non-numeric delta_e", () => {
    const lots: SpcInputLot[] = [
      lot("a", "p1", 1, "2026-06-01T00:00:00Z"),
      { id: "b", product_id: "p1", delta_e: null, checked_at: "2026-06-02T00:00:00Z" },
    ];
    const results = buildSpc(lots, products);
    expect(results.find((r) => r.productId === "p1")?.n).toBe(1);
  });
});

describe("capabilityLabel", () => {
  it("maps verdicts to labels", () => {
    expect(capabilityLabel("capable")).toContain("Capable");
    expect(capabilityLabel("marginal")).toContain("Marginal");
    expect(capabilityLabel("not-capable")).toContain("Not capable");
    expect(capabilityLabel("insufficient")).toContain("Insufficient");
  });
});
