import "server-only";

import { createHash } from "crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getDaasUrl } from "@/lib/api/auth-headers";
import {
  type EmployeeAccountRole,
  getEmployeeAccountRole,
} from "@/lib/auth/account-roles";

const DEFAULT_SIGNUP_ROLE_ID = "9b288a57-8b99-42d2-9206-b3bb41d31e22";
const DEFAULT_SIGNUP_ROLE_NAME = "pending_approval";

export interface SignupAccountInput {
  email: string;
  password: string;
  role?: EmployeeAccountRole;
}

export interface SignupAccountResult {
  user: User;
  role: EmployeeAccountRole | typeof DEFAULT_SIGNUP_ROLE_NAME;
}

function deterministicRoleLinkId(userId: string, roleId: string): string {
  const hex = createHash("sha256").update(`${userId}:${roleId}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function getStaticDaaSHeaders(): Record<string, string> {
  const token = process.env.DAAS_STATIC_TOKEN;

  if (!token) {
    throw new Error("DAAS_STATIC_TOKEN is required to provision signup roles.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function createDaaSItem(
  collection: string,
  payload: Record<string, unknown>
): Promise<void> {
  const response = await fetch(`${getDaasUrl()}/api/items/${collection}`, {
    method: "POST",
    headers: getStaticDaaSHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (response.ok || response.status === 409) {
    return;
  }

  let message = `Failed to create ${collection}.`;
  try {
    const data = (await response.json()) as {
      errors?: Array<{ message?: string }>;
      error?: string;
      message?: string;
    };
    message = data.errors?.[0]?.message ?? data.error ?? data.message ?? message;
  } catch {
    // Keep the generic message when the upstream response is not JSON.
  }

  if (/duplicate key value|unique constraint|already exists/i.test(message)) {
    return;
  }

  throw new Error(message);
}

export async function provisionPendingApprovalUser(
  user: Pick<User, "id" | "email">,
  provider = "email"
): Promise<void> {
  await provisionUserWithRole(user, DEFAULT_SIGNUP_ROLE_ID, provider);
}

async function provisionUserWithRole(
  user: Pick<User, "id" | "email">,
  roleId: string,
  provider = "email"
): Promise<void> {
  await createDaaSItem("daas_users", {
    id: user.id,
    email: user.email,
    status: "active",
    provider,
    external_identifier: user.id,
    first_name: user.email?.split("@")[0] ?? "New",
  });

  await createDaaSItem("daas_user_roles", {
    id: deterministicRoleLinkId(user.id, roleId),
    user_id: user.id,
    role_id: roleId,
  });
}

async function createConfirmedAuthUser(
  supabase: SupabaseClient,
  input: SignupAccountInput
): Promise<User> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      provider: "email",
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Signup did not return a user.");
  }

  return data.user;
}

async function signInEmailPasswordUser(input: SignupAccountInput): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("Login did not return a user.");
  }

  return user;
}

export async function createEmailPasswordAccount(
  input: SignupAccountInput
): Promise<SignupAccountResult> {
  const admin = createSupabaseAdmin();
  let user: User;
  let isExistingUser = false;
  const selectedRole = input.role ? getEmployeeAccountRole(input.role) : null;
  const roleId = selectedRole?.roleId ?? DEFAULT_SIGNUP_ROLE_ID;
  const roleName = selectedRole?.value ?? DEFAULT_SIGNUP_ROLE_NAME;

  try {
    user = await createConfirmedAuthUser(admin, input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/already|registered|exists|duplicate/i.test(message)) {
      throw error;
    }

    user = await signInEmailPasswordUser(input);
    isExistingUser = true;
  }

  try {
    await provisionUserWithRole(user, roleId);
  } catch (error) {
    if (!isExistingUser) {
      await admin.auth.admin.deleteUser(user.id);
    }
    throw error;
  }

  if (!isExistingUser && !selectedRole) {
    await signInEmailPasswordUser(input);
  }

  return {
    user,
    role: roleName,
  };
}
