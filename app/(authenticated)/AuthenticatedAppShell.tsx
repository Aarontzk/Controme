"use client";

import { Box, Button, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { IconLockAccess } from "@tabler/icons-react";

import { ContentLayout } from "@/components/ui/content-layout";
import { AppRoleNavigation } from "@/components/navigation/AppRoleNavigation";
import { NavFooter } from "./NavFooter";
import darkLogo from "@/assets/dark logo.png";
import {
  canAccessPath,
  getLandingHref,
  getMenuForRoles,
  getProtectedRouteForPath,
} from "@/lib/auth/role-gating";
import { useAppRoles } from "@/lib/auth/useAppRoles";

function AccessDeniedView({
  attemptedLabel,
  landingHref,
  onNavigate,
}: {
  attemptedLabel: string;
  landingHref: string | null;
  onNavigate: (href: string) => void;
}) {
  return (
    <Box
      style={{
        alignItems: "center",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        minHeight: "calc(100dvh - 168px)",
        padding: "clamp(32px, 7vh, 96px) var(--ds-spacing-5)",
        textAlign: "center",
      }}
    >
      <Stack gap="xl" maw={760} w="100%" align="center">
        <ThemeIcon
          size={88}
          radius={8}
          color="red"
          variant="light"
          aria-hidden
        >
          <IconLockAccess size={46} />
        </ThemeIcon>
        <Stack gap="sm" align="center">
          <Title order={2} size="clamp(32px, 4vw, 48px)">
            You don't have access to this dashboard.
          </Title>
          <Text c="dimmed" size="xl" maw={680}>
            Your current role cannot open {attemptedLabel}. Use the workspace
            assigned to your role, or ask an administrator to update your access.
          </Text>
        </Stack>
        <Group gap="md" justify="center">
          {landingHref && (
            <Button
              color="primary"
              radius={8}
              size="md"
              onClick={() => onNavigate(landingHref)}
            >
              Go to my workspace
            </Button>
          )}
        </Group>
      </Stack>
    </Box>
  );
}

export function AuthenticatedAppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { roles: userRoles, loading } = useAppRoles();

  const menuItems = useMemo(() => getMenuForRoles(userRoles), [userRoles]);
  const protectedRoute = useMemo(
    () => getProtectedRouteForPath(pathname),
    [pathname]
  );
  const landingHref = useMemo(() => getLandingHref(userRoles), [userRoles]);
  const accessDenied =
    !loading && protectedRoute !== null && !canAccessPath(userRoles, pathname);
  const currentItem = useMemo(
    () =>
      menuItems.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      ),
    [menuItems, pathname]
  );

  return (
    <ContentLayout
      title={accessDenied ? "Access restricted" : currentItem?.label ?? "Controme"}
      breadcrumbs={[{ label: "Controme", href: "/" }]}
      loading={loading}
      sidebarWidth={300}
      sidebar={
        <Box
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            height: "100dvh",
            minHeight: 0,
            padding: "var(--ds-spacing-3)"
          }}
        >
          <Box
            style={{
              borderBottom: "1px solid var(--ds-border-color)",
              flexShrink: 0,
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
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              paddingTop: "var(--ds-spacing-3)"
            }}
          >
            <AppRoleNavigation
              menuItems={menuItems}
              currentHref={currentItem?.href}
              onNavigate={router.push}
              loading={loading}
              isAdmin={userRoles.includes("admin")}
            />
          </Box>
          <NavFooter roles={userRoles} />
        </Box>
      }
    >
      {accessDenied ? (
        <AccessDeniedView
          attemptedLabel={protectedRoute.label}
          landingHref={landingHref}
          onNavigate={router.push}
        />
      ) : (
        children
      )}
    </ContentLayout>
  );
}
