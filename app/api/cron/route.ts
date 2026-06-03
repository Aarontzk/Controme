/**
 * DaaS Cron proxy — collection level.
 *
 * GET  /api/cron  → DaaS GET  /api/cron  (list jobs)
 * POST /api/cron  → DaaS POST /api/cron  (create job)
 *
 * Admin-only: DaaS rejects non-admin callers with 403. See lib/api/daas-proxy.ts.
 */

import { type NextRequest } from "next/server";

import { proxyToDaaS, runProxy } from "@/lib/api/daas-proxy";

export async function GET(request: NextRequest) {
  return runProxy(() => proxyToDaaS(request, "/api/cron", "GET"));
}

export async function POST(request: NextRequest) {
  return runProxy(() => proxyToDaaS(request, "/api/cron", "POST"));
}
