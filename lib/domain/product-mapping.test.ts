import { describe, expect, it } from "vitest";

import { mapDaasProduct, type DaasProductRow } from "./product-mapping";

const row: DaasProductRow = {
  id: "c4c1ccb9-47f9-4217-a992-4e8fd366f890",
  name: "Spray-Dried Ginger Powder",
  sku: "GIN-SD-01",
  category: "powder",
  ref_l: 68.5,
  ref_a: 7.2,
  ref_b: 32.4,
  tol_l: 4,
  tol_a: 2,
  tol_b: 3.5,
  delta_e_max: 5,
  rgb_approx: "#D4A443",
  active: true,
};

describe("mapDaasProduct", () => {
  it("maps flat DaaS columns to the nested domain reference", () => {
    const product = mapDaasProduct(row);
    expect(product.id).toBe(row.id);
    expect(product.reference).toEqual({ L: 68.5, a: 7.2, b: 32.4 });
    expect(product.tolerance).toEqual({ L: 4, a: 2, b: 3.5 });
    expect(product.deltaEMax).toBe(5);
    expect(product.rgbApprox).toEqual({ r: 212, g: 164, b: 67 });
  });

  it("parses a hex without leading hash", () => {
    const product = mapDaasProduct({ ...row, rgb_approx: "C44A7A" });
    expect(product.rgbApprox).toEqual({ r: 196, g: 74, b: 122 });
  });

  it("leaves rgbApprox undefined for an invalid hex", () => {
    const product = mapDaasProduct({ ...row, rgb_approx: "nope" });
    expect(product.rgbApprox).toBeUndefined();
  });

  it("throws when a colour reference value is missing", () => {
    const broken = { ...row, ref_l: NaN };
    expect(() => mapDaasProduct(broken)).toThrow("incomplete colour reference");
  });
});
