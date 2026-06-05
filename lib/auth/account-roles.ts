import { z } from "zod";

export const EMPLOYEE_ACCOUNT_ROLES = [
  {
    value: "qc_operator",
    label: "QC Operator",
    roleId: "723ffac2-631d-48ad-b4fe-0f80146038aa",
    description: "Capture QC lots and read product references.",
  },
  {
    value: "ppic",
    label: "PPIC",
    roleId: "cf72ea37-e568-422a-97e4-9f854d5ab997",
    description: "Review lot clearance and production readiness.",
  },
  {
    value: "manager",
    label: "Manager",
    roleId: "10d554ea-7e3d-4f7d-bddb-63240ec2d952",
    description: "Read dashboards, exports, audit evidence, and QC history.",
  },
] as const;

export const accountRoleSchema = z.enum([
  "qc_operator",
  "ppic",
  "manager",
]);

export type EmployeeAccountRole = z.infer<typeof accountRoleSchema>;

export function getEmployeeAccountRole(role: EmployeeAccountRole) {
  return EMPLOYEE_ACCOUNT_ROLES.find((option) => option.value === role);
}
