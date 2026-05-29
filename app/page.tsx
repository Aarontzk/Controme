"use client";

import { Center, Loader, Stack, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getLandingHref } from "@/lib/auth/role-gating";
import { useAppRoles } from "@/lib/auth/useAppRoles";

/**
 * Root entry point. Sends the user straight to where they work instead of a
 * dead starter page: unauthenticated → /login, otherwise the first page their
 * role grants (operators → capture, PPIC/manager → dashboard, admin → capture).
 * This keeps the whole app reachable by clicking — no manual URL typing.
 */
export default function HomePage() {
  const router = useRouter();
  const { roles, loading } = useAppRoles();

  useEffect(() => {
    if (loading) return;
    if (roles.length === 0) {
      router.replace("/login");
      return;
    }
    router.replace(getLandingHref(roles) ?? "/login");
  }, [loading, roles, router]);

  return (
    <Center mih="100dvh">
      <Stack align="center" gap="sm">
        <Loader />
        <Text c="dimmed" size="sm">
          Loading your workspace…
        </Text>
      </Stack>
    </Center>
  );
}
