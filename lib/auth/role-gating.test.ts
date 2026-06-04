import { describe, expect, it } from "vitest";

import {
  getLandingHref,
  getMenuForRoles,
  getRoleNames,
  requireRole,
} from "./role-gating";

describe("role gating", () => {
  it("maps DaaS user role payloads to app roles", () => {
    expect(
      getRoleNames({
        role: "qc_operator",
        roles: [{ id: "ppic", name: "PPIC" }],
      })
    ).toEqual(["qc_operator", "ppic"]);
  });

  it("resolves role names from DaaS junction rows (roles[].role_id)", () => {
    expect(
      getRoleNames({
        roles: [
          {
            id: "c1acef57-junction",
            role_id: { id: "10d554ea-role", name: "manager" },
          },
        ],
      })
    ).toEqual(["manager"]);
  });

  it("resolves a role_id given as a bare string name", () => {
    expect(getRoleNames({ roles: [{ id: "jid", role_id: "qc_operator" }] })).toEqual([
      "qc_operator",
    ]);
  });

  it("treats admin access as the app admin role", () => {
    expect(getRoleNames({ admin_access: true })).toEqual(["admin"]);
  });

  it("maps generic and pending users to the approval role", () => {
    expect(getRoleNames({ roles: [{ name: "User" }] })).toEqual(["pending_approval"]);
    expect(getRoleNames({ roles: [{ name: "pending_approval" }] })).toEqual([
      "pending_approval",
    ]);
  });

  it("allows admin through every frontend role gate", () => {
    expect(requireRole(["admin"], ["manager"])).toBe(true);
  });

  it("shows only operator capture and lot history items for QC operators", () => {
    expect(getMenuForRoles(["qc_operator"]).map((item) => item.href)).toEqual([
      "/qc/capture",
      "/qc/lots",
    ]);
  });

  it("shows PPIC dashboard and read-only lot history for PPIC", () => {
    expect(getMenuForRoles(["ppic"]).map((item) => item.href)).toEqual([
      "/dashboard/ppic",
      "/qc/lots",
    ]);
  });

  it("shows manager dashboard and read-only lot history for managers", () => {
    expect(getMenuForRoles(["manager"]).map((item) => item.href)).toEqual([
      "/dashboard/manager",
      "/qc/lots",
    ]);
  });

  it("lands pending users on the approval page", () => {
    expect(getLandingHref(["pending_approval"])).toBe("/approval");
  });

  it("lets operational roles override pending approval", () => {
    expect(getLandingHref(["pending_approval", "qc_operator"])).toBe("/qc/capture");
  });
});
