import { describe, expect, it } from "vitest";

import { buildProductListFilter } from "./product-search";

describe("buildProductListFilter", () => {
  it("returns null when no product filter is active", () => {
    expect(buildProductListFilter({})).toBeNull();
    expect(
      buildProductListFilter({
        search: "   ",
        category: "all",
        active: "all"
      })
    ).toBeNull();
  });

  it("searches product name, code, and sku with the trimmed term", () => {
    expect(buildProductListFilter({ search: "  ginger  " })).toEqual({
      _or: [
        { name: { _contains: "ginger" } },
        { code: { _contains: "ginger" } },
        { sku: { _contains: "ginger" } }
      ]
    });
  });

  it("filters by product category", () => {
    expect(buildProductListFilter({ category: "natural_extract" })).toEqual({
      category: { _eq: "natural_extract" }
    });
  });

  it("filters active and inactive products", () => {
    expect(buildProductListFilter({ active: "active" })).toEqual({
      active: { _eq: true }
    });
    expect(buildProductListFilter({ active: "inactive" })).toEqual({
      active: { _eq: false }
    });
  });

  it("combines search, category, and active filters with AND", () => {
    expect(
      buildProductListFilter({
        search: "PATCH",
        category: "essential_oil",
        active: "inactive"
      })
    ).toEqual({
      _and: [
        {
          _or: [
            { name: { _contains: "PATCH" } },
            { code: { _contains: "PATCH" } },
            { sku: { _contains: "PATCH" } }
          ]
        },
        { category: { _eq: "essential_oil" } },
        { active: { _eq: false } }
      ]
    });
  });
});
