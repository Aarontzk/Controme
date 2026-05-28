import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/poc/vision",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
});
