"use client";

import { useEffect, useState } from "react";

import { getRoleNames, type AppRole, type UserRoleSource } from "./role-gating";

interface AppRolesState {
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Resolve the current user's app roles via the same-origin Next.js proxy
 * (`/api/auth/user`), which forwards the Supabase session cookie to DaaS
 * server-side.
 *
 * We deliberately avoid the Buildpad `useAuth` hook here: in direct (browser →
 * DaaS) mode it requests `${DAAS}/users/me` without the `/api` prefix, DaaS
 * 301-redirects to `/api/users/me`, and the browser blocks the redirect on the
 * CORS preflight ("Redirect is not allowed for a preflight request"). That
 * leaves `auth.user` null and every role gate empty. Going through the proxy
 * sidesteps CORS entirely and returns the full user payload (incl. roles).
 */
export function useAppRoles(): AppRolesState {
  const [state, setState] = useState<AppRolesState>({
    roles: [],
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          if (active) setState({ roles: [], isAdmin: false, loading: false });
          return;
        }
        const json = (await response.json()) as { data?: UserRoleSource };
        const roles = getRoleNames(json.data);
        if (active) {
          setState({ roles, isAdmin: roles.includes("admin"), loading: false });
        }
      } catch {
        if (active) setState({ roles: [], isAdmin: false, loading: false });
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
