/**
 * GET /api/activity
 *
 * Proxy to the Buildpad DaaS immutable activity log.
 * Restricted to admin and manager roles for audit evidence.
 */

import { type NextRequest, NextResponse } from "next/server";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import { getRoleNames, requireRole } from "@/lib/auth/role-gating";
import { buildActivityQuery } from "@/lib/domain/activity-query";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      return jsonError("Authentication required.", 401);
    }

    const daasUrl = getDaaSUrl();
    const meRes = await fetch(`${daasUrl}/api/users/me`, { headers, cache: "no-store" });
    if (!meRes.ok) {
      return jsonError("Unable to verify role.", 403);
    }

    const meJson = (await meRes.json()) as { data?: Parameters<typeof getRoleNames>[0] };
    const roles = getRoleNames(meJson.data);
    if (!requireRole(roles, ["admin", "manager"])) {
      return jsonError("Audit log access requires Manager or Admin.", 403);
    }

    const sp = request.nextUrl.searchParams;
    const query = buildActivityQuery({
      limit: sp.get("limit"),
      offset: sp.get("offset"),
      sort: sp.get("sort"),
      collection: sp.get("collection"),
      filter: sp.get("filter"),
    });

    const activityRes = await fetch(`${daasUrl}/api/activity?${query}`, {
      headers,
      cache: "no-store",
    });

    if (!activityRes.ok) {
      const detail = await activityRes.text();
      return jsonError(`Activity log unavailable: ${detail.slice(0, 200)}`, activityRes.status);
    }

    const json = await activityRes.json();
    return NextResponse.json(json, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return jsonError(message, 500);
  }
}
