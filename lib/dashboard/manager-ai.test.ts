import { describe, expect, it } from "vitest";

import { buildManagerAiAnswer, type ManagerAiAnswer } from "./manager-ai";
import type { QcLotAnalyticsRow } from "./qc-analytics";

const rows: QcLotAnalyticsRow[] = [
  {
    id: "1",
    product_id: { id: "ginger", name: "Ginger" },
    lot_code: "LOT-1",
    status: "pass",
    delta_e: 1.2,
    checked_at: "2026-05-28T01:00:00.000Z",
  },
  {
    id: "2",
    product_id: { id: "ginger", name: "Ginger" },
    lot_code: "LOT-2",
    status: "reject",
    delta_e: 6.1,
    reject_reason: "color",
    checked_at: "2026-05-28T02:00:00.000Z",
  },
  {
    id: "3",
    product_id: { id: "vanilla", name: "Vanilla" },
    lot_code: "LOT-3",
    status: "pass",
    warning_flag: true,
    delta_e: 4.2,
    checked_at: "2026-05-28T03:00:00.000Z",
  },
];

function answer(question: string): ManagerAiAnswer {
  return buildManagerAiAnswer(rows, question);
}

describe("manager AI answers", () => {
  it("summarizes manager QC status", () => {
    expect(answer("summarize current qc performance")).toMatchObject({
      title: "Manager QC summary",
      tone: "reject",
    });
  });

  it("highlights risk lots first", () => {
    const result = answer("which lots need attention?");

    expect(result.title).toBe("Manager attention needed");
    expect(result.tone).toBe("reject");
    expect(result.bullets[0]).toContain("LOT-3");
    expect(result.bullets[1]).toContain("LOT-2");
  });

  it("identifies weakest pass rate by product", () => {
    const result = answer("weakest product pass rate");

    expect(result.title).toBe("Weakest product pass rate");
    expect(result.body).toContain("Ginger");
    expect(result.body).toContain("50%");
  });

  it("returns an empty state when there are no lots", () => {
    expect(buildManagerAiAnswer([], "summary")).toMatchObject({
      title: "No QC lots yet",
      tone: "neutral",
    });
  });
});
