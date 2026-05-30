import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authHeadersMock = vi.hoisted(() => ({
  headers: {} as Record<string, string>,
}));

vi.mock("@/lib/api/auth-headers", () => ({
  getAuthHeaders: vi.fn(() => authHeadersMock.headers),
  getDaaSUrl: vi.fn(() => "https://daas.example.test"),
}));

import { GET } from "./route";

function request(path = "/api/activity") {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe("GET /api/activity", () => {
  beforeEach(() => {
    authHeadersMock.headers = {};
    vi.restoreAllMocks();
  });

  it("requires authentication", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Authentication required.",
    });
  });

  it("rejects non-manager roles", async () => {
    authHeadersMock.headers = { Authorization: "Bearer token" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ data: { roles: [{ name: "qc_operator" }] } })
      )
    );

    const response = await GET(request());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Audit log access requires Manager or Admin.",
    });
  });

  it("proxies activity queries for managers", async () => {
    authHeadersMock.headers = { Authorization: "Bearer token" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: { roles: [{ name: "manager" }] } }))
      .mockResolvedValueOnce(Response.json({ data: [{ id: "activity-1" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request("/api/activity?collection=qc_lots&limit=5"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [{ id: "activity-1" }] });
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("https://daas.example.test/api/activity?"),
      expect.objectContaining({ headers: { Authorization: "Bearer token" } })
    );
    expect(fetchMock.mock.calls[1]?.[0]).toContain("limit=5");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("filter=");
  });
});
