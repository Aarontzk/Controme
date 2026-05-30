export interface ActivityQueryOptions {
  limit?: string | null;
  offset?: string | null;
  sort?: string | null;
  collection?: string | null;
  filter?: string | null;
}

export function buildActivityQuery(options: ActivityQueryOptions): URLSearchParams {
  const query = new URLSearchParams({
    limit: options.limit || "100",
    sort: options.sort || "-timestamp",
  });

  if (options.offset) query.set("offset", options.offset);

  let filter: Record<string, unknown> = {};
  if (options.filter) {
    try {
      const parsed = JSON.parse(options.filter);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        filter = parsed as Record<string, unknown>;
      }
    } catch {
      filter = {};
    }
  }

  if (options.collection) {
    filter.collection = { _eq: options.collection };
  }

  if (Object.keys(filter).length > 0) {
    query.set("filter", JSON.stringify(filter));
  }

  return query;
}
