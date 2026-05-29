import { describe, expect, it } from "vitest";

import { buildQCCoaCsv, buildQCCoaFilename } from "./qc-export";

describe("buildQCCoaCsv", () => {
  it("builds a CSV export with product names and warning flags", () => {
    const csv = buildQCCoaCsv(
      [
        {
          id: "lot-1",
          checked_at: "2026-05-28T10:00:00.000Z",
          product_id: "product-1",
          qc_stage: "incoming",
          status: "pass",
          delta_e: 4.8,
          l_value: 70,
          a_value: 9.1,
          b_value: 37.2,
          warning_flag: true,
          reference_version: 2,
          reject_reason: null,
          operator_id: "operator-1",
        },
      ],
      [{ id: "product-1", name: "Ginger Powder", sku: "GINGER-001" }]
    );

    expect(csv).toContain("checked_at,lot_id,product_name");
    expect(csv).toContain(
      "2026-05-28T10:00:00.000Z,lot-1,Ginger Powder,GINGER-001,incoming,pass,4.8,70,9.1,37.2,true,2,,operator-1"
    );
  });

  it("escapes commas and quotes", () => {
    const csv = buildQCCoaCsv(
      [
        {
          id: "lot-2",
          product_id: { id: "product-2", name: 'Dragon, "Fruit"', sku: null },
          warning_flag: false,
          reject_reason: "color, consistency",
        },
      ],
      []
    );

    expect(csv).toContain('"Dragon, ""Fruit"""');
    expect(csv).toContain('"color, consistency"');
  });
});

describe("buildQCCoaFilename", () => {
  it("uses the ISO date", () => {
    expect(buildQCCoaFilename(new Date("2026-05-28T10:00:00.000Z"))).toBe(
      "controme-coa-2026-05-28.csv"
    );
  });
});
