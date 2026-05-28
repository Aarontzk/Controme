"use client";

import { Box, Stack, Text } from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { ContentLayout } from "@/components/ui/content-layout";
import { AppRoleNavigation } from "@/components/navigation/AppRoleNavigation";
import { useAuth, usePermissions } from "@/lib/buildpad/hooks";
import { getMenuForRoles, getRoleNames } from "@/lib/auth/role-gating";

export function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const permissions = usePermissions({
    collections: ["products", "qc_lots", "product_reference_versions"],
  });

  const userRoles = useMemo(() => {
    const roles = getRoleNames({
      ...auth.user,
      admin_access: auth.isAdmin || permissions.isAdmin || auth.user?.admin_access,
    });
    return roles;
  }, [auth.isAdmin, auth.user, permissions.isAdmin]);

  const menuItems = useMemo(() => getMenuForRoles(userRoles), [userRoles]);
  const currentItem = useMemo(
    () =>
      menuItems.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      ),
    [menuItems, pathname]
  );

  return (
    <ContentLayout
      title={currentItem?.label ?? "Controme"}
      breadcrumbs={[{ label: "Controme", href: "/" }]}
      loading={auth.loading || permissions.loading}
      sidebar={
        <Stack gap="sm" p="sm">
          <Box px="xs" py="sm">
            <Text fw={700}>Controme</Text>
            <Text size="xs" c="dimmed">
              Colour QC & Lot Traceability
            </Text>
          </Box>
          <AppRoleNavigation
            menuItems={menuItems}
            currentHref={currentItem?.href}
            onNavigate={router.push}
            loading={auth.loading || permissions.loading}
            isAdmin={userRoles.includes("admin")}
          />
        </Stack>
      }
    >
      {children}
    </ContentLayout>
  );
}
