import { expect, test } from "@playwright/test";

test("ginger-like image returns pass with deterministic delta E", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-pass.svg");

  await expect(page.getByTestId("qc-status")).toHaveText("pass");
  await expect(page.getByTestId("qc-delta-e")).toContainText("0.00");
});

test("off-color image returns reject", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/blue-reject.svg");

  await expect(page.getByTestId("qc-status")).toHaveText("reject");
});

test("contaminated image rejects even when powder color is close", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-contaminated.svg");

  await expect(page.getByTestId("qc-status")).toHaveText("reject");
  await expect(page.getByTestId("contamination-status")).toHaveText("reject");
  await expect(page.getByTestId("color-status")).toHaveText("pass");
});

test("clumpy texture rejects through the consistency lane", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-clumpy.svg");

  await expect(page.getByTestId("qc-status")).toHaveText("reject");
  await expect(page.getByTestId("consistency-status")).toHaveText("reject");
});

test("session calibration can accept a generated-looking reference sample", async ({
  page,
}) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-near-reference.svg");

  await expect(page.getByTestId("color-status")).toHaveText("reject");
  await page.getByRole("button", { name: "Use as session reference" }).click();
  await expect(page.getByTestId("color-status")).toHaveText("pass");
  await expect(page.getByTestId("qc-status")).toHaveText("pass");
});

test("photo-style smooth ginger powder returns pass", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-photo-smooth-pass.png");

  await expect(page.getByTestId("qc-status")).toHaveText("pass");
  await expect(page.getByTestId("color-status")).toHaveText("pass");
  await expect(page.getByTestId("consistency-status")).toHaveText("pass");
});

test("photo-style bright ginger powder returns pass", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-photo-bright-pass.png");

  await expect(page.getByTestId("qc-status")).toHaveText("pass");
  await expect(page.getByTestId("color-status")).toHaveText("pass");
  await expect(page.getByTestId("consistency-status")).toHaveText("pass");
});

test("photo-style blue powder rejects through the color lane", async ({ page }) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-photo-blue-reject.png");

  await expect(page.getByTestId("qc-status")).toHaveText("reject");
  await expect(page.getByTestId("color-status")).toHaveText("reject");
});

test("photo-style rough powder rejects through the consistency lane", async ({
  page,
}) => {
  await page.goto("/poc/vision");
  await page
    .locator('input[name="sample-photo"]')
    .setInputFiles("e2e/fixtures/ginger-photo-rough-texture-reject.png");

  await expect(page.getByTestId("qc-status")).toHaveText("reject");
  await expect(page.getByTestId("color-status")).toHaveText("pass");
  await expect(page.getByTestId("consistency-status")).toHaveText("reject");
});
