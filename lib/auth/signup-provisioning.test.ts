import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const supabaseMocks = vi.hoisted(() => {
  const adminCreateUser = vi.fn();
  const adminDeleteUser = vi.fn();
  const signInWithPassword = vi.fn();

  return {
    adminCreateUser,
    adminDeleteUser,
    signInWithPassword,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    auth: {
      admin: {
        createUser: supabaseMocks.adminCreateUser,
        deleteUser: supabaseMocks.adminDeleteUser,
      },
    },
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: supabaseMocks.signInWithPassword,
    },
  })),
}));

vi.mock("@/lib/api/auth-headers", () => ({
  getDaasUrl: vi.fn(() => "https://daas.example.test"),
}));

import { createEmailPasswordAccount } from "./signup-provisioning";

const input = {
  email: "new@example.com",
  password: "password123",
};

const user = {
  id: "user-1",
  email: input.email,
};

describe("createEmailPasswordAccount", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.DAAS_STATIC_TOKEN = "static-token";
  });

  it("continues when DaaS already provisioned the user row", async () => {
    supabaseMocks.adminCreateUser.mockResolvedValue({ data: { user }, error: null });
    supabaseMocks.signInWithPassword.mockResolvedValue({
      data: { user },
      error: null,
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          {
            errors: [
              {
                message:
                  'Failed to create item: duplicate key value violates unique constraint "directus_users_pkey"',
              },
            ],
          },
          { status: 500 }
        )
      )
      .mockResolvedValueOnce(Response.json({ data: { id: "role-link-1" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createEmailPasswordAccount(input)).resolves.toMatchObject({
      user,
      role: "pending_approval",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBeDefined();
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      id: expect.any(String),
      role_id: "9b288a57-8b99-42d2-9206-b3bb41d31e22",
      user_id: user.id,
    });
    expect(supabaseMocks.adminDeleteUser).not.toHaveBeenCalled();
  });

  it("repairs role provisioning for an already-created auth user", async () => {
    supabaseMocks.adminCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });
    supabaseMocks.signInWithPassword.mockResolvedValue({
      data: { user },
      error: null,
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ data: { id: user.id } }))
        .mockResolvedValueOnce(Response.json({ data: { id: "role-link-1" } }))
    );

    await expect(createEmailPasswordAccount(input)).resolves.toMatchObject({
      user,
      role: "pending_approval",
    });
    expect(supabaseMocks.signInWithPassword).toHaveBeenCalledWith(input);
  });
});
