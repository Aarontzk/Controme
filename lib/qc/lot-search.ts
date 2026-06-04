export type LotStatusFilter = "all" | "pass" | "reject";
export type LotWarningFilter = "all" | "warning" | "clear";

export interface LotHistoryFilterInput {
  search?: string;
  status?: LotStatusFilter;
  warningFlag?: LotWarningFilter;
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
      { lot_code: { _contains: term } },
      { product_id: { name: { _contains: term } } }
    ]
  };
}

function buildStatusFilter(status: LotStatusFilter = "all"): DaasFilter | null {
  if (status === "all") return null;
  return { status: { _eq: status } };
}

function buildWarningFilter(
  warningFlag: LotWarningFilter = "all"
): DaasFilter | null {
  if (warningFlag === "all") return null;
  return { warning_flag: { _eq: warningFlag === "warning" } };
}

export function buildLotHistoryFilter(
  input: LotHistoryFilterInput
): DaasFilter | null {
  return compactFilters([
    buildSearchFilter(input.search),
    buildStatusFilter(input.status),
    buildWarningFilter(input.warningFlag)
  ]);
}
