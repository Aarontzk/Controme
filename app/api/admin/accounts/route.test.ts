import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  createEmailPasswordAccount: vi.fn(),
  getAuthHeaders: vi.fn(),
  getDaaSUrl: vi.fn(),
}));

vi.mock("@/lib/api/auth-headers", () => ({
  getAuthHeaders: routeMocks.getAuthHeaders,
  getDaaSUrl: routeMocks.getDaaSUrl,
}));

vi.mock("@/lib/auth/signup-provisioning", () => ({
  createEmailPasswordAccount: routeMocks.createEmailPasswordAccount,
}));

import { POST } from "./route";

function request(body: unknown) {
  return new NextRequest("http://localhost:3000/api/admin/accounts", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function mockMe(user: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: user }));
}

describe("POST /api/admin/accounts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    routeMocks.getDaaSUrl.mockReturnValue("https://daas.example.test");
  });

  it("requires authentication", async () => {
    routeMocks.getAuthHeaders.mockResolvedValue({});

    const response = await POST(
      request({
        email: "new@example.com",
        password: "password123",
        role: "qc_operator",
      })
    );

    expect(response.status).toBe(401);
    expect(routeMocks.createEmailPasswordAccount).not.toHaveBeenCalled();
  });

  it("requires administrator access", async () => {
    routeMocks.getAuthHeaders.mockResolvedValue({
      Authorization: "Bearer user-token",
    });
    mockMe({ roles: [{ name: "manager" }] });

    const response = await POST(
      request({
        email: "new@example.com",
        password: "password123",
        role: "qc_operator",
      })
    );

    expect(response.status).toBe(403);
    expect(routeMocks.createEmailPasswordAccount).not.toHaveBeenCalled();
  });

  it("validates account input for admins", async () => {
    routeMocks.getAuthHeaders.mockResolvedValue({
      Authorization: "Bearer admin-token",
    });
    mockMe({ admin_access: true });

    const response = await POST(request({ email: "bad", password: "short" }));

    expect(response.status).toBe(400);
    expect(routeMocks.createEmailPasswordAccount).not.toHaveBeenCalled();
  });

  it("creates an email/password account for admins", async () => {
    routeMocks.getAuthHeaders.mockResolvedValue({
      Authorization: "Bearer admin-token",
    });
    mockMe({ admin_access: true });
    routeMocks.createEmailPasswordAccount.mockResolvedValue({
      user: { id: "user-1", email: "new@example.com" },
      role: "qc_operator",
    });

    const response = await POST(
      request({
        email: "new@example.com",
        password: "password123",
        role: "qc_operator",
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        user: { id: "user-1", email: "new@example.com" },
        role: "qc_operator",
      },
    });
    expect(routeMocks.createEmailPasswordAccount).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
      role: "qc_operator",
    });
  });

  it("returns conflict when the email is already registered", async () => {
    routeMocks.getAuthHeaders.mockResolvedValue({
      Authorization: "Bearer admin-token",
    });
    mockMe({ admin_access: true });
    routeMocks.createEmailPasswordAccount.mockRejectedValue(
      new Error("User already registered")
    );

    const response = await POST(
      request({
        email: "new@example.com",
        password: "password123",
        role: "qc_operator",
      })
    );

    expect(response.status).toBe(409);
  });
});
