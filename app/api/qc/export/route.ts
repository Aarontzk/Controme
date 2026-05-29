import { type NextRequest, NextResponse } from "next/server";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import {
  buildQCCoaCsv,
  buildQCCoaFilename,
  type QcExportLotRow,
  type QcExportProductRow,
} from "@/lib/domain/qc-export";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function buildLotsQuery(request: NextRequest): string {
  const searchParams = request.nextUrl.searchParams;
  const lotId = searchParams.get("lot_id");
  const productId = searchParams.get("product_id");
  const status = searchParams.get("status");

  const filter: Record<string, { _eq: string }> = {};
  if (lotId) filter.id = { _eq: lotId };
  if (productId) filter.product_id = { _eq: productId };
  if (status) filter.status = { _eq: status };

  const query = new URLSearchParams({
    limit: searchParams.get("limit") ?? "500",
    sort: "-checked_at",
  });

  if (Object.keys(filter).length > 0) {
    query.set("filter", JSON.stringify(filter));
  }

  return query.toString();
}

async function fetchProducts(
  daasUrl: string,
  headers: Record<string, string>,
  productIds: string[]
): Promise<QcExportProductRow[]> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const query = new URLSearchParams({
    fields: "id,name,sku",
    limit: String(uniqueIds.length),
    filter: JSON.stringify({ id: { _in: uniqueIds } }),
  });

  const response = await fetch(`${daasUrl}/api/items/products?${query}`, {
    headers,
    cache: "no-store",
  });
  if (!response.ok) return [];

  const json = (await response.json()) as { data?: QcExportProductRow[] };
  return Array.isArray(json.data) ? json.data : [];
}

function extractProductId(product: QcExportLotRow["product_id"]): string {
  if (!product) return "";
  return typeof product === "string" ? product : product.id ?? "";
}

export async function GET(request: NextRequest) {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      return jsonError("Authentication required.", 401);
    }

    const daasUrl = getDaaSUrl();
    const lotsRes = await fetch(`${daasUrl}/api/items/qc_lots?${buildLotsQuery(request)}`, {
      headers,
      cache: "no-store",
    });

    if (!lotsRes.ok) {
      const detail = await lotsRes.text();
      return jsonError(`Failed to export QC lots: ${detail.slice(0, 200)}`, lotsRes.status);
    }

    const lotsJson = (await lotsRes.json()) as { data?: QcExportLotRow[] };
    const lots = Array.isArray(lotsJson.data) ? lotsJson.data : [];
    const products = await fetchProducts(
      daasUrl,
      headers,
      lots.map((lot) => extractProductId(lot.product_id))
    );
    const csv = buildQCCoaCsv(lots, products);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildQCCoaFilename()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected export error.";
    return jsonError(message, 500);
  }
}
