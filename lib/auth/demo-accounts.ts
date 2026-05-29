/**
 * Demo quick-login accounts for the login screen.
 *
 * These are throwaway `*.test` seed accounts used to make demos/judging fast:
 * pick a role from the dropdown and the login form auto-submits — no typing.
 *
 * ⚠️ The passwords ship in the client bundle, so this is for demo accounts
 * ONLY. Disable in any real deployment by setting
 * `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`, and rotate these credentials after
 * judging.
 */

export interface DemoAccount {
  id: string;
  label: string;
  email: string;
  password: string;
}

/** Default ON; set NEXT_PUBLIC_ENABLE_DEMO_LOGIN="false" to hide the dropdown. */
export const DEMO_LOGIN_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== "false";

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    id: "admin",
    label: "Admin — full access",
    email: "admin2@controme.test",
    password: "Controme!Ad2026",
  },
  {
    id: "operator",
    label: "QC Operator — capture",
    email: "operator@controme.test",
    password: "Controme!Op2026",
  },
  {
    id: "ppic",
    label: "PPIC — dashboard",
    email: "ppic@controme.test",
    password: "Controme!Pp2026",
  },
  {
    id: "manager",
    label: "Manager — export",
    email: "manager@controme.test",
    password: "Controme!Mg2026",
  },
] as const;
