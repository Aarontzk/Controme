"use client";

import { Center, Loader, Stack, Text } from "@mantine/core";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import darkLogo from "@/assets/dark logo.png";
import { getLandingHref } from "@/lib/auth/role-gating";
import { useAppRoles } from "@/lib/auth/useAppRoles";

/**
 * Root entry point. Sends the user straight to where they work instead of a
 * dead starter page: unauthenticated -> /login, otherwise the first page their
 * role grants (operators -> capture, PPIC/manager -> dashboard, admin -> capture).
 * This keeps the whole app reachable by clicking, no manual URL typing.
 */
export default function HomePage() {
  const router = useRouter();
  const { roles, authenticated, loading } = useAppRoles();

  useEffect(() => {
    if (loading) return;
    if (!authenticated) {
      router.replace("/login");
      return;
    }
    router.replace(getLandingHref(roles) ?? "/approval");
  }, [authenticated, loading, roles, router]);

  return (
    <Center
      mih="100dvh"
      style={{
        background:
          "linear-gradient(180deg, var(--ds-surface-deep) 0%, var(--ds-body-bg) 100%)"
      }}
    >
      <Stack align="center" gap="sm">
        <Image
          src={darkLogo}
          alt="Controme"
          width={140}
          priority
          style={{ height: "auto", width: "min(140px, 54vw)" }}
        />
        <Loader color="cta" />
        <Text c="dimmed" size="sm">
          Loading your workspace...
        </Text>
      </Stack>
    </Center>
  );
}
