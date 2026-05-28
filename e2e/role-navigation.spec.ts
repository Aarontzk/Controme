import { expect, test } from "@playwright/test";

type RoleScenario = {
  role: "qc_operator" | "ppic" | "manager" | "admin";
  visible: string[];
  hidden: string[];
};

const scenarios: RoleScenario[] = [
  {
    role: "qc_operator",
    visible: ["QC Capture", "QC Lot History"],
    hidden: ["PPIC Dashboard", "Manager Dashboard", "Product References"],
  },
  {
    role: "ppic",
    visible: ["PPIC Dashboard", "QC Lot History"],
    hidden: ["QC Capture", "Manager Dashboard", "Product References"],
  },
  {
    role: "manager",
    visible: ["Manager Dashboard", "QC Lot History"],
    hidden: ["QC Capture", "PPIC Dashboard", "Product References"],
  },
  {
    role: "admin",
    visible: [
      "QC Capture",
      "QC Lot History",
      "PPIC Dashboard",
      "Manager Dashboard",
      "Product References",
    ],
    hidden: [],
  },
];

for (const scenario of scenarios) {
  test(`sidebar navigation is scoped for ${scenario.role}`, async ({ page }) => {
    await page.goto(`/poc/role-navigation?role=${scenario.role}`);

    for (const label of scenario.visible) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    for (const label of scenario.hidden) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }
  });
}
