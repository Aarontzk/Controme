import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import type { DaasProductRow } from "@/lib/domain";

type Params = { params: Promise<{ id: string }> };

const updateReferenceSchema = z.object({
  ref_l: z.number().finite(),
  ref_a: z.number().finite(),
  ref_b: z.number().finite(),
  tol_l: z.number().finite().nonnegative(),
  tol_a: z.number().finite().nonnegative(),
  tol_b: z.number().finite().nonnegative(),
  delta_e_max: z.number().finite().positive(),
  rgb_approx: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  reason: z.string().trim().min(3).max(500),
});

interface DaaSUser {
  id?: string;
  admin_access?: boolean;
  role?: string | { name?: string };
  roles?: Array<string | { name?: string }>;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function roleName(role: string | { name?: string } | undefined): string {
  if (!role) return "";
  return typeof role === "string" ? role : role.name ?? "";
}

function isAdminUser(user: DaaSUser | undefined): boolean {
  if (!user) return false;
  if (user.admin_access === true) return true;
  const names = [roleName(user.role), ...(user.roles ?? []).map(roleName)].map((name) =>
    name.toLowerCase()
  );
  return names.some((name) => name === "admin" || name === "administrator");
}

async function getCurrentUser(
  daasUrl: string,
  headers: Record<string, string>
): Promise<DaaSUser | undefined> {
  const response = await fetch(`${daasUrl}/api/users/me`, { headers, cache: "no-store" });
  if (!response.ok) return undefined;
  const json = (await response.json()) as { data?: DaaSUser };
  return json.data;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      return jsonError("Authentication required.", 401);
    }

    const daasUrl = getDaaSUrl();
    const user = await getCurrentUser(daasUrl, headers);
    if (!isAdminUser(user)) {
      return jsonError("Admin access required.", 403);
    }

    const { id } = await params;
    const body = updateReferenceSchema.safeParse(await request.json());
    if (!body.success) {
      return jsonError(body.error.issues[0]?.message ?? "Invalid reference update.", 400);
    }

    const productRes = await fetch(`${daasUrl}/api/items/products/${id}`, {
      headers,
      cache: "no-store",
    });
    if (productRes.status === 404) {
      return jsonError("Product not found.", 404);
    }
    if (!productRes.ok) {
      const detail = await productRes.text();
      return jsonError(`Failed to read product: ${detail.slice(0, 200)}`, productRes.status);
    }

    const productJson = (await productRes.json()) as { data?: DaasProductRow };
    const product = productJson.data;
    if (!product) {
      return jsonError("Product not found.", 404);
    }

    const currentVersion = typeof product.version === "number" ? product.version : 1;
    const versionBody = {
      product_id: id,
      ref_l: product.ref_l,
      ref_a: product.ref_a,
      ref_b: product.ref_b,
      tol_l: product.tol_l,
      tol_a: product.tol_a,
      tol_b: product.tol_b,
      delta_e_max: product.delta_e_max,
      changed_by: user?.id ?? null,
      changed_at: new Date().toISOString(),
      reason: body.data.reason,
    };

    const versionRes = await fetch(`${daasUrl}/api/items/product_reference_versions`, {
      method: "POST",
      headers,
      body: JSON.stringify(versionBody),
      cache: "no-store",
    });
    if (!versionRes.ok) {
      const detail = await versionRes.text();
      return jsonError(
        `Failed to create reference version: ${detail.slice(0, 200)}`,
        versionRes.status
      );
    }

    const { reason: _reason, ...referenceUpdate } = body.data;
    const updateRes = await fetch(`${daasUrl}/api/items/products/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        ...referenceUpdate,
        version: currentVersion + 1,
      }),
      cache: "no-store",
    });
    if (!updateRes.ok) {
      const detail = await updateRes.text();
      return jsonError(`Failed to update product: ${detail.slice(0, 200)}`, updateRes.status);
    }

    const updated = await updateRes.json();
    return NextResponse.json({ success: true, data: updated.data ?? updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected reference update error.";
    return jsonError(message, 500);
  }
}
