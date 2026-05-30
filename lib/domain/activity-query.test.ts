import { describe, expect, it } from "vitest";

import { buildActivityQuery } from "./activity-query";

describe("buildActivityQuery", () => {
  it("defaults to recent activity with a bounded page size", () => {
    const query = buildActivityQuery({});

    expect(query.get("limit")).toBe("100");
    expect(query.get("sort")).toBe("-timestamp");
  });

  it("merges collection shorthand into a DaaS filter", () => {
    const query = buildActivityQuery({
      collection: "qc_lots",
      filter: JSON.stringify({ action: { _eq: "create" } }),
    });

    expect(JSON.parse(query.get("filter") ?? "{}")).toEqual({
      action: { _eq: "create" },
      collection: { _eq: "qc_lots" },
    });
  });

  it("ignores invalid filter JSON instead of forwarding malformed input", () => {
    const query = buildActivityQuery({ filter: "{nope", collection: "products" });

    expect(JSON.parse(query.get("filter") ?? "{}")).toEqual({
      collection: { _eq: "products" },
    });
  });
});
