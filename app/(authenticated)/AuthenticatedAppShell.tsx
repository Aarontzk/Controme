"use client";

import { Box, Stack, Text } from "@mantine/core";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { ContentLayout } from "@/components/ui/content-layout";
import { AppRoleNavigation } from "@/components/navigation/AppRoleNavigation";
import darkLogo from "@/assets/dark logo.png";
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
      sidebarWidth={300}
      sidebar={
        <Stack gap="var(--ds-spacing-3)" p="var(--ds-spacing-3)">
          <Box
            style={{
              borderBottom: "1px solid var(--ds-border-color)",
              padding: "var(--ds-spacing-2) var(--ds-spacing-1) var(--ds-spacing-4)"
            }}
          >
            <Image
              src={darkLogo}
              alt="Controme"
              width={118}
              priority
              style={{
                height: "auto",
                width: "min(118px, 70%)",
                marginBottom: "var(--ds-spacing-3)"
              }}
            />
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
