import { describe, expect, it } from "vitest";

import {
  buildDemoSeedReadiness,
  buildSchemaReadinessCheck,
  extractFieldNames,
} from "./readiness";

describe("extractFieldNames", () => {
  it("extracts DaaS field names from common response shapes", () => {
    expect(
      extractFieldNames({
        data: [{ field: "warning_flag" }, { name: "qc_stage" }, { key: "reference_version" }],
      })
    ).toEqual(["qc_stage", "reference_version", "warning_flag"]);
  });
});

describe("buildSchemaReadinessCheck", () => {
  it("reports missing fields", () => {
    const check = buildSchemaReadinessCheck(
      "qc_lots",
      { data: [{ field: "warning_flag" }] },
      ["warning_flag", "qc_stage"]
    );

    expect(check.ready).toBe(false);
    expect(check.missingFields).toEqual(["qc_stage"]);
  });
});

describe("buildDemoSeedReadiness", () => {
  it("passes when demo data covers pass, reject, warning, and both stages", () => {
    const readiness = buildDemoSeedReadiness([
      { product_id: "p1", status: "pass", warning_flag: false, qc_stage: "incoming" },
      { product_id: "p1", status: "pass", warning_flag: true, qc_stage: "finish" },
      { product_id: "p1", status: "reject", warning_flag: false, qc_stage: "incoming" },
      { product_id: "p2", status: "pass", warning_flag: false, qc_stage: "finish" },
      { product_id: "p2", status: "pass", warning_flag: false, qc_stage: "incoming" },
      { product_id: "p2", status: "reject", warning_flag: false, qc_stage: "finish" },
    ]);

    expect(readiness.ready).toBe(true);
    expect(readiness.missing).toEqual([]);
  });

  it("reports missing demo coverage", () => {
    const readiness = buildDemoSeedReadiness([
      { product_id: "p1", status: "pass", warning_flag: false, qc_stage: "incoming" },
    ]);

    expect(readiness.ready).toBe(false);
    expect(readiness.missing).toContain("at least 2 seeded products");
    expect(readiness.missing).toContain("at least 1 warning_flag lot");
    expect(readiness.missing).toContain("at least 1 finish QC lot");
  });
});
