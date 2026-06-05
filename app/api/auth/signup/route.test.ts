import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/auth/signup", () => {
  it("rejects public account creation", async () => {
    const response = await POST();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      errors: [
        {
          message:
            "Public account creation is disabled. Ask an administrator to create employee accounts.",
        },
      ],
    });
  });
});
