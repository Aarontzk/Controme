import { describe, expect, it } from "vitest";

import { buildLotCsv, toCsvValue } from "./csv";

describe("csv export", () => {
  it("escapes commas, quotes, and newlines", () => {
    expect(toCsvValue('a,"b"\nc')).toBe('"a,""b""\nc"');
  });

  it("builds a one-row lot CSV", () => {
    expect(buildLotCsv({ lot_code: "LOT-1", status: "pass", delta_e: 1.23 })).toBe(
      "lot_code,status,delta_e\r\nLOT-1,pass,1.23\r\n"
    );
  });
});
