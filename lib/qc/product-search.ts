export type ProductCategoryFilter =
  | "all"
  | "essential_oil"
  | "aromatic_chemical"
  | "natural_extract"
  | "powder";

export type ProductActiveFilter = "all" | "active" | "inactive";

export interface ProductListFilterInput {
  search?: string;
  category?: ProductCategoryFilter;
  active?: ProductActiveFilter;
}

export type DaasFilter = Record<string, unknown>;

function compactFilters(filters: Array<DaasFilter | null>): DaasFilter | null {
  const activeFilters = filters.filter((filter): filter is DaasFilter => !!filter);

  if (activeFilters.length === 0) return null;
  if (activeFilters.length === 1) return activeFilters[0];

  return { _and: activeFilters };
}

function buildSearchFilter(search?: string): DaasFilter | null {
  const term = search?.trim();
  if (!term) return null;

  return {
    _or: [
      { name: { _contains: term } },
      { code: { _contains: term } },
      { sku: { _contains: term } }
    ]
  };
}

function buildCategoryFilter(
  category: ProductCategoryFilter = "all"
): DaasFilter | null {
  if (category === "all") return null;
  return { category: { _eq: category } };
}

function buildActiveFilter(active: ProductActiveFilter = "all"): DaasFilter | null {
  if (active === "all") return null;
  return { active: { _eq: active === "active" } };
}

export function buildProductListFilter(
  input: ProductListFilterInput
): DaasFilter | null {
  return compactFilters([
    buildSearchFilter(input.search),
    buildCategoryFilter(input.category),
    buildActiveFilter(input.active)
  ]);
}
