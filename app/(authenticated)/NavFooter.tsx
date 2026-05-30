"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconLogout, IconUserCircle } from "@tabler/icons-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  ppic: "PPIC",
  operator: "Operator",
};

interface NavFooterProps {
  roles: string[];
}

/**
 * Account footer pinned to the bottom of the left navbar. Shows the current
 * role and offers "Ganti akun" / "Logout" — both sign out via the server-side
 * proxy (`/api/auth/logout`) and return to /login, where the role quick-login
 * dropdown lets the user pick another account.
 */
export function NavFooter({ roles }: NavFooterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout(): Promise<void> {
    if (loading) return;
    setLoading(true);
    let next = "/login";
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const json = (await res.json().catch(() => null)) as {
        data?: { idpLogoutUrl?: string | null };
      } | null;
      if (json?.data?.idpLogoutUrl) next = json.data.idpLogoutUrl;
    } catch {
      // fall through to /login redirect below
    }
    router.push(next);
    router.refresh();
  }

  const primary = roles[0];
  const roleLabel = primary ? ROLE_LABELS[primary] ?? primary : "Akun";

  return (
    <Box
      mt="auto"
      pt="var(--ds-spacing-3)"
      style={{ borderTop: "1px solid var(--ds-border-color)" }}
    >
      <Group gap="xs" wrap="nowrap" mb="var(--ds-spacing-2)" px="var(--ds-spacing-1)">
        <Avatar color="primary" radius="xl" size={34}>
          {roleLabel.slice(0, 1).toUpperCase()}
        </Avatar>
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Text size="sm" fw={600} truncate>
            {roleLabel}
          </Text>
          <Text size="xs" c="dimmed">
            Sedang masuk
          </Text>
        </Stack>
      </Group>

      <Stack gap="var(--ds-spacing-2)">
        <Button
          variant="light"
          color="primary"
          size="xs"
          fullWidth
          leftSection={<IconUserCircle size={16} />}
          loading={loading}
          onClick={logout}
        >
          Ganti akun
        </Button>
        <Button
          variant="subtle"
          color="red"
          size="xs"
          fullWidth
          leftSection={<IconLogout size={16} />}
          loading={loading}
          onClick={logout}
        >
          Logout
        </Button>
      </Stack>
    </Box>
  );
}
