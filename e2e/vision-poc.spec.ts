import { expect, test } from "@playwright/test";

test("ginger-like image returns pass with deterministic delta E", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-pass.svg");

  await expect(page.getByTestId("qc-status")).toHaveText("pass");
  await expect(page.getByTestId("qc-delta-e")).toContainText("0.11");
});

test("off-color image returns reject", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/blue-reject.svg");

  await expect(page.getByTestId("qc-status")).toHaveText("reject");
});
