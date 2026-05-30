/**
 * Ask AI — DaaS data tools
 *
 * Tools the Gemini model can call to read the user's QC data. Every call
 * forwards the signed-in user's Supabase JWT to DaaS via getAuthHeaders(),
 * so DaaS RBAC is enforced server-side — the model can only read what the
 * current manager is allowed to read.
 *
 * Pattern adapted from the Buildpad "chat with your data" tutorial:
 * https://app.buildpad.ai/docs/tutorials/ai/chat-with-your-data
 */

import { tool } from "ai";
import { z } from "zod";
import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";

interface DaasField {
  collection: string;
  field: string;
  type?: string;
}

interface DaasCollection {
  collection: string;
}

async function daas<T>(path: string): Promise<T> {
  const url = `${getDaaSUrl()}${path}`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`DaaS ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export const dataTools = {
  list_collections: tool({
    description:
      "List all collections available to the signed-in user, with each collection's field names and types. Call this first when you do not yet know what data exists.",
    inputSchema: z.object({}),
    execute: async () => {
      const [{ data: collections }, { data: fields }] = await Promise.all([
        daas<{ data: DaasCollection[] }>("/api/collections"),
        daas<{ data: DaasField[] }>("/api/fields"),
      ]);

      return collections.map((c) => ({
        collection: c.collection,
        fields: fields
          .filter((f) => f.collection === c.collection)
          .map((f) => ({ field: f.field, type: f.type })),
      }));
    },
  }),

  query_collection: tool({
    description:
      "Fetch rows from a collection to answer questions about the user's data. For QC questions use the 'qc_lots' collection (fields: lot_code, product_id, qc_stage, status, warning_flag, delta_e, reject_reason, checked_at). Call list_collections first if unsure of the slug.",
    inputSchema: z.object({
      collection: z
        .string()
        .describe("Collection slug, e.g. 'qc_lots' or 'qc_products'."),
      limit: z.number().int().min(1).max(200).default(50),
      sort: z
        .string()
        .optional()
        .describe(
          "Field to sort by. Prefix with '-' for descending, e.g. '-checked_at' for newest first."
        ),
      filter: z
        .string()
        .optional()
        .describe(
          "Optional DaaS filter as a JSON string, e.g. '{\"status\":{\"_eq\":\"reject\"}}'."
        ),
    }),
    execute: async ({ collection, limit, sort, filter }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (sort) params.set("sort", sort);
      if (filter) params.set("filter", filter);
      const { data } = await daas<{ data: unknown[] }>(
        `/api/items/${collection}?${params}`
      );
      return data;
    },
  }),
};
