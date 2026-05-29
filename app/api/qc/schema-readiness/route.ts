import { NextResponse } from "next/server";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import { buildSchemaReadinessCheck, REQUIRED_DAAS_FIELDS } from "@/lib/domain/readiness";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function fetchFields(daasUrl: string, headers: Record<string, string>, collection: string) {
  const response = await fetch(`${daasUrl}/api/fields/${collection}`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to read ${collection} fields: ${detail.slice(0, 200)}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      return jsonError("Authentication required.", 401);
    }

    const daasUrl = getDaaSUrl();
    const checks = await Promise.all(
      Object.entries(REQUIRED_DAAS_FIELDS).map(async ([collection, fields]) =>
        buildSchemaReadinessCheck(
          collection,
          await fetchFields(daasUrl, headers, collection),
          fields
        )
      )
    );

    return NextResponse.json({
      success: true,
      ready: checks.every((check) => check.ready),
      checks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected schema readiness error.";
    return jsonError(message, 500);
  }
}
