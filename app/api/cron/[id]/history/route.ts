/**
 * DaaS Cron proxy — execution history.
 *
 * GET /api/cron/[id]/history  → DaaS GET /api/cron/{id}/history  (run history)
 *
 * Admin-only via DaaS RBAC.
 */

import { type NextRequest } from "next/server";

import { proxyToDaaS, runProxy } from "@/lib/api/daas-proxy";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return runProxy(() => proxyToDaaS(request, `/api/cron/${id}/history`, "GET"));
}
