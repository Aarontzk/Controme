import { NextResponse } from "next/server";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import { buildDemoSeedReadiness, type DemoSeedLot } from "@/lib/domain/readiness";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET() {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      return jsonError("Authentication required.", 401);
    }

    const daasUrl = getDaaSUrl();
    const lotsRes = await fetch(`${daasUrl}/api/items/qc_lots?limit=500&sort=-checked_at`, {
      headers,
      cache: "no-store",
    });

    if (!lotsRes.ok) {
      const detail = await lotsRes.text();
      return jsonError(`Failed to read QC lots: ${detail.slice(0, 200)}`, lotsRes.status);
    }

    const lotsJson = (await lotsRes.json()) as { data?: DemoSeedLot[] };
    const lots = Array.isArray(lotsJson.data) ? lotsJson.data : [];

    return NextResponse.json({
      success: true,
      data: buildDemoSeedReadiness(lots),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected demo readiness error.";
    return jsonError(message, 500);
  }
}
