/**
 * Generic DaaS proxy forwarder for Next.js route handlers.
 *
 * Forwards a browser request to the DaaS backend with the caller's Supabase JWT
 * (Rule 4: no CORS — all browser→backend calls go through Next.js). DaaS enforces
 * its own RBAC on the target endpoint, so admin-only endpoints (e.g. /api/cron)
 * return 403 for non-admin callers without any extra guard here.
 */

import { type NextRequest, NextResponse } from "next/server";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";

/**
 * Forward `request` to `${DaaS}/${path}` using `method`, preserving query string,
 * request body, and content type. Returns the DaaS response as JSON (or 204).
 */
export async function proxyToDaaS(
  request: NextRequest,
  path: string,
  method: string
): Promise<NextResponse> {
  const daasUrl = getDaaSUrl();
  const headers = await getAuthHeaders();
  const qs = request.nextUrl.searchParams.toString();
  const url = `${daasUrl}${path}${qs ? `?${qs}` : ""}`;

  const init: RequestInit = { method, headers, cache: "no-store" };

  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type");
    if (contentType) {
      (init.headers as Record<string, string>)["Content-Type"] = contentType;
    }
    try {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) init.body = body;
    } catch {
      // no body
    }
  }

  const response = await fetch(url, init);

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}

/** Wrap a proxy call with the project's standard error envelope. */
export async function runProxy(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
