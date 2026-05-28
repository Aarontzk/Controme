"use client";

import { Box, Stack, Text } from "@mantine/core";
import { useRouter } from "next/navigation";

import { AppRoleNavigation } from "@/components/navigation/AppRoleNavigation";
import { APP_ROLES, getMenuForRoles, type AppRole } from "@/lib/auth/role-gating";

export function RoleNavigationPreview({ role }: { role: AppRole }) {
  const router = useRouter();
  const roles = role === "admin" ? APP_ROLES : [role];
  const menuItems = getMenuForRoles(roles);

  return (
    <Box maw={320} p="md">
      <Stack gap="sm">
        <Box px="xs">
          <Text fw={700}>Controme</Text>
          <Text size="xs" c="dimmed">
            Navigation preview: {role}
          </Text>
        </Box>
        <AppRoleNavigation
          menuItems={menuItems}
          currentHref={menuItems[0]?.href}
          onNavigate={router.push}
          isAdmin={role === "admin"}
        />
      </Stack>
    </Box>
  );
}
