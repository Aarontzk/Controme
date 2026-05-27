import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    // Vendored Buildpad code is not unit-tested here.
    exclude: ["node_modules/**", ".next/**", "components/ui/**", "lib/buildpad/**"],
  },
});
