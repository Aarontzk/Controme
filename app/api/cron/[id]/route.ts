/**
 * DaaS Cron proxy — single job.
 *
 * GET    /api/cron/[id]  → DaaS GET    /api/cron/{id}  (read)
 * PATCH  /api/cron/[id]  → DaaS PATCH  /api/cron/{id}  (update + hot-reload)
 * DELETE /api/cron/[id]  → DaaS DELETE /api/cron/{id}  (delete — may be disabled)
 *
 * Admin-only via DaaS RBAC.
 */

import { type NextRequest } from "next/server";

import { proxyToDaaS, runProxy } from "@/lib/api/daas-proxy";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return runProxy(() => proxyToDaaS(request, `/api/cron/${id}`, "GET"));
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return runProxy(() => proxyToDaaS(request, `/api/cron/${id}`, "PATCH"));
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return runProxy(() => proxyToDaaS(request, `/api/cron/${id}`, "DELETE"));
}
