/**
 * DaaS Cron proxy — manual trigger.
 *
 * POST /api/cron/[id]/run  → DaaS POST /api/cron/{id}/run  (run_now)
 *
 * Admin-only via DaaS RBAC.
 */

import { type NextRequest } from "next/server";

import { proxyToDaaS, runProxy } from "@/lib/api/daas-proxy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return runProxy(() => proxyToDaaS(request, `/api/cron/${id}/run`, "POST"));
}
