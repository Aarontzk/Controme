import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * Authenticated end-to-end coverage for the real QC flow through the Next.js
 * proxy (not the unauthenticated PoC pages). Proves the last open blocker:
 * a qc_operator can capture → save a lot that persists with the new schema
 * fields, while a manager sees export but has QC Capture hidden by RBAC.
 *
 * Requires the E2E_* role credentials in `.env.local` (loaded by
 * playwright.config.ts). Skips gracefully if they are absent so the suite
 * stays green on machines without seeded role accounts.
 */

const SAMPLE_PHOTO = resolve(__dirname, "fixtures", "ginger-photo-smooth-pass.png");

type Role = "OPERATOR" | "PPIC" | "MANAGER" | "ADMIN";

function credsFor(role: Role): { email: string; password: string } | null {
  const email = process.env[`E2E_${role}_EMAIL`];
  const password = process.env[`E2E_${role}_PASSWORD`];
  if (!email || !password) return null;
  return { email, password };
}

async function login(page: Page, role: Role): Promise<void> {
  const creds = credsFor(role);
  if (!creds) throw new Error(`Missing E2E_${role}_EMAIL / E2E_${role}_PASSWORD`);
  const response = await page.request.post("/api/auth/login", {
    data: creds,
    headers: { "Content-Type": "application/json" },
  });
  expect(
    response.ok(),
    `login ${role} failed (${response.status()}): ${await response.text()}`
  ).toBeTruthy();
}

test.describe("authenticated QC flow", () => {
  test("qc_operator captures and persists a lot", async ({ page }) => {
    test.skip(!credsFor("OPERATOR"), "E2E_OPERATOR_* not configured");
    await login(page, "OPERATOR");

    await page.goto("/qc/capture");
    await expect(page.getByRole("heading", { name: "QC Capture", level: 1 })).toBeVisible();

    // No-products alert means seed/permissions are wrong — fail loudly.
    await expect(page.getByText("No products available.")).toHaveCount(0);

    await page.setInputFiles('input[name="sample-photo"]', SAMPLE_PHOTO);

    // Save enables only once the client has measured ΔE from the photo.
    const saveButton = page.getByTestId("save-lot");
    await expect(saveButton).toBeEnabled({ timeout: 20_000 });

    const [saveResponse] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/qc/lots") && r.request().method() === "POST"
      ),
      saveButton.click(),
    ]);
    expect(saveResponse.ok(), `save failed: ${await saveResponse.text()}`).toBeTruthy();

    const saved = (await saveResponse.json()) as {
      success?: boolean;
      data?: { id?: string };
      result?: { status?: string };
    };
    expect(saved.success).toBeTruthy();
    const lotId = saved.data?.id;
    expect(lotId, "server did not return a persisted lot id").toBeTruthy();

    await expect(page.getByTestId("saved-lot")).toBeVisible();
    await expect(page.getByTestId("saved-status")).toHaveText(/pass|reject/);

    // Persistence: the immutable record is readable on its detail page, and
    // export is hidden from the operator (RBAC: admin/manager only).
    await page.goto(`/qc/lots/${lotId}`);
    await expect(page.getByRole("heading", { name: "QC Lot Detail", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export CSV" })).toHaveCount(0);
  });

  test("manager sees export but QC Capture is hidden", async ({ page }) => {
    test.skip(!credsFor("MANAGER"), "E2E_MANAGER_* not configured");
    await login(page, "MANAGER");

    await page.goto("/qc/lots");

    // Sidebar RBAC: manager scope shows dashboards + history, never capture.
    await expect(page.getByText("Manager Dashboard", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("QC Capture", { exact: true })).toHaveCount(0);

    // Manager can read a lot and export it.
    const lotsResponse = await page.request.get("/api/items/qc_lots?limit=1");
    expect(lotsResponse.ok(), `lots fetch failed: ${lotsResponse.status()}`).toBeTruthy();
    const lots = (await lotsResponse.json()) as { data?: Array<{ id?: string }> };
    const lotId = lots.data?.[0]?.id;
    test.skip(!lotId, "no seeded lots to export");

    await page.goto(`/qc/lots/${lotId}`);
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible({
      timeout: 20_000,
    });
  });
});
