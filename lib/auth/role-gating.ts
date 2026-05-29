export const APP_ROLES = [
  "admin",
  "qc_operator",
  "ppic",
  "manager",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface RoleLike {
  id?: string | null;
  name?: string | null;
  /**
   * DaaS returns a user's roles as junction rows shaped like
   * `{ id: <junction-id>, role_id: { id, name } | <role-id-string> }`.
   * The human role name lives on `role_id`, not on the junction row, so we
   * must look through it when resolving role names.
   */
  role_id?: string | { id?: string | null; name?: string | null } | null;
}

export interface UserRoleSource {
  admin_access?: boolean | null;
  role?: string | null;
  roles?: RoleLike[] | null;
}

export interface AppMenuItem {
  id: string;
  label: string;
  href: string;
  group: "qc" | "dashboard" | "admin";
  order: number;
  roles: readonly AppRole[];
}

const ROLE_ALIASES: Record<string, AppRole> = {
  admin: "admin",
  administrator: "admin",
  qc_operator: "qc_operator",
  "qc operator": "qc_operator",
  operator: "qc_operator",
  ppic: "ppic",
  manager: "manager",
};

export const APP_MENU_ITEMS: readonly AppMenuItem[] = [
  {
    id: "qc-capture",
    label: "QC Capture",
    href: "/qc/capture",
    group: "qc",
    order: 10,
    roles: ["admin", "qc_operator"],
  },
  {
    id: "qc-lots",
    label: "QC Lot History",
    href: "/qc/lots",
    group: "qc",
    order: 40,
    roles: ["admin", "qc_operator", "ppic", "manager"],
  },
  {
    id: "dashboard-ppic",
    label: "PPIC Dashboard",
    href: "/dashboard/ppic",
    group: "dashboard",
    order: 20,
    roles: ["admin", "ppic"],
  },
  {
    id: "dashboard-manager",
    label: "Manager Dashboard",
    href: "/dashboard/manager",
    group: "dashboard",
    order: 30,
    roles: ["admin", "manager"],
  },
  {
    id: "admin-products",
    label: "Product References",
    href: "/admin/products",
    group: "admin",
    order: 50,
    roles: ["admin"],
  },
] as const;

export function normalizeRoleName(role: string | null | undefined): AppRole | null {
  if (!role) return null;
  return ROLE_ALIASES[role.trim().toLowerCase().replaceAll("-", "_")] ?? null;
}

export function getRoleNames(user: UserRoleSource | null | undefined): AppRole[] {
  const roles = new Set<AppRole>();

  if (user?.admin_access) {
    roles.add("admin");
  }

  const primaryRole = normalizeRoleName(user?.role);
  if (primaryRole) {
    roles.add(primaryRole);
  }

  for (const role of user?.roles ?? []) {
    const candidates = [role.id, role.name];
    if (typeof role.role_id === "string") {
      candidates.push(role.role_id);
    } else if (role.role_id) {
      candidates.push(role.role_id.id, role.role_id.name);
    }
    for (const candidate of candidates) {
      const normalized = normalizeRoleName(candidate);
      if (normalized) roles.add(normalized);
    }
  }

  return [...roles];
}

export function requireRole(
  userRoles: readonly AppRole[],
  allowedRoles: readonly AppRole[]
): boolean {
  return userRoles.includes("admin") || allowedRoles.some((role) => userRoles.includes(role));
}

export function getMenuForRoles(userRoles: readonly AppRole[]): AppMenuItem[] {
  return APP_MENU_ITEMS.filter((item) => requireRole(userRoles, item.roles)).sort(
    (a, b) => a.order - b.order
  );
}

/**
 * The page a freshly-logged-in user should land on, based on their roles. We
 * reuse the role-scoped menu and take its first (lowest-order) item, so the
 * landing always matches what the sidebar shows: operators land on capture,
 * PPIC/manager on their dashboard, etc. Returns null when no menu is available.
 */
export function getLandingHref(userRoles: readonly AppRole[]): string | null {
  return getMenuForRoles(userRoles)[0]?.href ?? null;
}
