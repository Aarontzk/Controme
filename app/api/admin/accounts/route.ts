import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import { accountRoleSchema } from "@/lib/auth/account-roles";
import { getRoleNames, requireRole } from "@/lib/auth/role-gating";
import { createEmailPasswordAccount } from "@/lib/auth/signup-provisioning";

const createAccountSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: accountRoleSchema,
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ errors: [{ message }] }, { status });
}

async function requireAdminRole(): Promise<NextResponse | null> {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) {
    return jsonError("Authentication required.", 401);
  }

  const meRes = await fetch(`${getDaaSUrl()}/api/users/me`, {
    headers,
    cache: "no-store",
  });
  if (!meRes.ok) {
    return jsonError("Unable to verify administrator access.", 403);
  }

  const meJson = (await meRes.json()) as {
    data?: Parameters<typeof getRoleNames>[0];
  };
  const roles = getRoleNames(meJson.data);
  if (!requireRole(roles, ["admin"])) {
    return jsonError("Administrator access required.", 403);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const adminError = await requireAdminRole();
    if (adminError) return adminError;

    const parsed = createAccountSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid account data.",
        400
      );
    }

    const account = await createEmailPasswordAccount(parsed.data);

    return NextResponse.json(
      {
        data: {
          user: {
            id: account.user.id,
            email: account.user.email,
          },
          role: account.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create account.";
    const status = /already|registered|exists|duplicate/i.test(message)
      ? 409
      : 500;
    return jsonError(message, status);
  }
}
