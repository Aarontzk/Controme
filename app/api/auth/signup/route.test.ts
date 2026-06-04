import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signupMock = vi.hoisted(() => ({
  createEmailPasswordAccount: vi.fn(),
}));

vi.mock("@/lib/auth/signup-provisioning", () => ({
  createEmailPasswordAccount: signupMock.createEmailPasswordAccount,
}));

import { POST } from "./route";

function request(body: unknown) {
  return new NextRequest("http://localhost:3000/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("validates email and password", async () => {
    const response = await POST(request({ email: "bad", password: "short" }));

    expect(response.status).toBe(400);
    expect(signupMock.createEmailPasswordAccount).not.toHaveBeenCalled();
  });

  it("creates an email/password account", async () => {
    signupMock.createEmailPasswordAccount.mockResolvedValue({
      user: { id: "user-1", email: "new@example.com" },
      role: "pending_approval",
    });

    const response = await POST(
      request({ email: "new@example.com", password: "password123" })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: {
        user: { id: "user-1", email: "new@example.com" },
        role: "pending_approval",
      },
    });
    expect(signupMock.createEmailPasswordAccount).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
    });
  });

  it("returns conflict when the email is already registered", async () => {
    signupMock.createEmailPasswordAccount.mockRejectedValue(
      new Error("User already registered")
    );

    const response = await POST(
      request({ email: "new@example.com", password: "password123" })
    );

    expect(response.status).toBe(409);
  });
});
