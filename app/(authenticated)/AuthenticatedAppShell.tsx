"use client";

import { Box, Stack, Text } from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { ContentLayout } from "@/components/ui/content-layout";
import { AppRoleNavigation } from "@/components/navigation/AppRoleNavigation";
import { getMenuForRoles } from "@/lib/auth/role-gating";
import { useAppRoles } from "@/lib/auth/useAppRoles";

export function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { roles: userRoles, loading } = useAppRoles();

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
      loading={loading}
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
            loading={loading}
            isAdmin={userRoles.includes("admin")}
          />
        </Stack>
      }
    >
      {children}
    </ContentLayout>
  );
}
