import { describe, expect, it } from "vitest";

import { buildLotHistoryFilter } from "./lot-search";

describe("buildLotHistoryFilter", () => {
  it("returns null when no filter is active", () => {
    expect(buildLotHistoryFilter({})).toBeNull();
    expect(
      buildLotHistoryFilter({ search: "   ", status: "all", warningFlag: "all" })
    ).toBeNull();
  });

  it("searches lot code and product name with the trimmed term", () => {
    expect(buildLotHistoryFilter({ search: "  ginger  " })).toEqual({
      _or: [
        { lot_code: { _contains: "ginger" } },
        { product_id: { name: { _contains: "ginger" } } }
      ]
    });
  });

  it("filters by pass and reject status", () => {
    expect(buildLotHistoryFilter({ status: "pass" })).toEqual({
      status: { _eq: "pass" }
    });
    expect(buildLotHistoryFilter({ status: "reject" })).toEqual({
      status: { _eq: "reject" }
    });
  });

  it("filters warning and clear lots", () => {
    expect(buildLotHistoryFilter({ warningFlag: "warning" })).toEqual({
      warning_flag: { _eq: true }
    });
    expect(buildLotHistoryFilter({ warningFlag: "clear" })).toEqual({
      warning_flag: { _eq: false }
    });
  });

  it("combines search, status, and warning filters with AND", () => {
    expect(
      buildLotHistoryFilter({
        search: "DF-0001",
        status: "reject",
        warningFlag: "warning"
      })
    ).toEqual({
      _and: [
        {
          _or: [
            { lot_code: { _contains: "DF-0001" } },
            { product_id: { name: { _contains: "DF-0001" } } }
          ]
        },
        { status: { _eq: "reject" } },
        { warning_flag: { _eq: true } }
      ]
    });
  });
});
