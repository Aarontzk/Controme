"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconClockHour4,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import darkLogo from "@/assets/dark logo.png";
import { DEMO_ACCOUNTS, DEMO_LOGIN_ENABLED } from "@/lib/auth/demo-accounts";
import {
  getRecentAccounts,
  type RecentAccount,
} from "@/lib/auth/recent-accounts";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  ppic: "PPIC",
  operator: "Operator",
};

const ACCOUNT_DESCRIPTIONS: Record<string, string> = {
  admin: "Full access",
  manager: "Manager dashboard and exports",
  ppic: "Production planning dashboard",
  operator: "QC capture workflow",
};

export default function ApprovalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [recentAccounts, setRecentAccounts] =
    useState<RecentAccount[]>(getRecentAccounts);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser(): Promise<void> {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;

        const json = (await response.json()) as {
          data?: { email?: string | null };
        };
        const email = json.data?.email;
        if (active && email) setCurrentEmail(email.toLowerCase());
      } catch {
        // Account switching still works with remembered/demo accounts.
      }
    }

    void loadCurrentUser();
    return () => {
      active = false;
    };
  }, []);

  const demoAccountsByEmail = useMemo(() => {
    return new Map(
      DEMO_ACCOUNTS.map((account) => [account.email.toLowerCase(), account]),
    );
  }, []);

  const manualRecentAccounts = recentAccounts.filter(
    (account) => !demoAccountsByEmail.has(account.email.toLowerCase()),
  );

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  async function switchDemoAccount(accountId: string): Promise<void> {
    if (loading || switchingId) return;

    const account = DEMO_ACCOUNTS.find((item) => item.id === accountId);
    if (!account) return;

    setSwitchingId(account.id);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
        credentials: "include",
      });

      const data = (await response.json().catch(() => null)) as {
        errors?: { message?: string }[];
      } | null;

      if (!response.ok) {
        throw new Error(data?.errors?.[0]?.message ?? "Failed to switch account");
      }

      notifications.show({
        title: "Account switched",
        message: `Signed in as ${ROLE_LABELS[account.id] ?? account.label}.`,
        color: "green",
      });

      router.replace("/");
      router.refresh();
    } catch (error) {
      notifications.show({
        title: "Switch failed",
        message:
          error instanceof Error ? error.message : "Failed to switch account",
        color: "red",
      });
    } finally {
      setSwitchingId(null);
    }
  }

  async function continueWithAccount(email: string): Promise<void> {
    if (loading || switchingId) return;
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace(`/login?email=${encodeURIComponent(email)}&remember=1`);
      router.refresh();
    }
  }

  return (
    <Box
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ds-spacing-6)",
        background: "var(--ds-surface-white)",
      }}
    >
      <Stack align="center" gap="var(--ds-spacing-5)" style={{ maxWidth: 520 }}>
        <Image
          src={darkLogo}
          alt="Controme"
          width={148}
          priority
          style={{ height: "auto", width: "min(148px, 56vw)" }}
        />
        <ThemeIcon size={64} radius="xl" color="yellow" variant="light">
          <IconClockHour4 size={34} />
        </ThemeIcon>
        <Stack align="center" gap="var(--ds-spacing-2)">
          <Title order={1} ta="center" style={{ color: "var(--ds-primary)" }}>
            Waiting for approval
          </Title>
          <Text ta="center" c="var(--ds-text-muted)">
            Your account has been created, but an admin needs to assign your
            Controme role before you can access your dashboard workspaces.
          </Text>
        </Stack>
        <Group justify="center">
          <Button
            leftSection={<IconUserCircle size={16} />}
            variant="light"
            color="primary"
            loading={Boolean(switchingId)}
            onClick={() => {
              setRecentAccounts(getRecentAccounts());
              setSwitcherOpen(true);
            }}
          >
            Switch account
          </Button>
          <Button
            leftSection={<IconLogout size={16} />}
            variant="subtle"
            color="gray"
            loading={loading}
            onClick={handleLogout}
          >
            Log out
          </Button>
        </Group>
      </Stack>

      <Modal
        opened={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        title="Switch account"
        size="sm"
        radius={8}
        centered
      >
        <Stack gap="var(--ds-spacing-3)">
          {manualRecentAccounts.length > 0 && (
            <Stack gap="xs">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Recent on this device
              </Text>
              {manualRecentAccounts.map((account) => {
                const isCurrent = account.email === currentEmail;

                return (
                  <UnstyledButton
                    key={account.email}
                    onClick={() => {
                      if (!isCurrent) void continueWithAccount(account.email);
                    }}
                    disabled={Boolean(switchingId || loading)}
                    style={{
                      background: isCurrent
                        ? "color-mix(in srgb, var(--ds-primary) 8%, var(--mantine-color-body))"
                        : "var(--mantine-color-body)",
                      border: isCurrent
                        ? "1px solid var(--ds-primary)"
                        : "1px solid var(--ds-border-color)",
                      borderRadius: 8,
                      cursor: isCurrent || loading ? "default" : "pointer",
                      padding: "var(--ds-spacing-3)",
                      width: "100%",
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Avatar color="primary" radius="xl" size={40}>
                          {account.email.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Text size="sm" fw={700} truncate>
                            {account.label ?? account.email.split("@")[0]}
                          </Text>
                          <Text size="xs" c="dimmed" truncate>
                            {account.email}
                          </Text>
                        </Stack>
                      </Group>
                      {isCurrent ? (
                        <IconCheck size={20} color="var(--ds-primary)" />
                      ) : (
                        <Text size="xs" c="dimmed">
                          Continue
                        </Text>
                      )}
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          )}

          {DEMO_LOGIN_ENABLED && (
            <Stack gap="xs">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Demo accounts
              </Text>
              {DEMO_ACCOUNTS.map((account) => {
                const accountLabel = ROLE_LABELS[account.id] ?? account.label;
                const isCurrent = account.email.toLowerCase() === currentEmail;
                const isSwitching = switchingId === account.id;

                return (
                  <UnstyledButton
                    key={account.id}
                    onClick={() => void switchDemoAccount(account.id)}
                    disabled={Boolean(switchingId)}
                    style={{
                      background: isCurrent
                        ? "color-mix(in srgb, var(--ds-primary) 8%, var(--mantine-color-body))"
                        : "var(--mantine-color-body)",
                      border: isCurrent
                        ? "1px solid var(--ds-primary)"
                        : "1px solid var(--ds-border-color)",
                      borderRadius: 8,
                      cursor: switchingId ? "not-allowed" : "pointer",
                      opacity: switchingId && !isSwitching ? 0.62 : 1,
                      padding: "var(--ds-spacing-3)",
                      width: "100%",
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Avatar color="primary" radius="xl" size={40}>
                          {accountLabel.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Text size="sm" fw={700} truncate>
                            {accountLabel}
                          </Text>
                          <Text size="xs" c="dimmed" truncate>
                            {ACCOUNT_DESCRIPTIONS[account.id] ?? account.email}
                          </Text>
                        </Stack>
                      </Group>
                      {isCurrent ? (
                        <IconCheck size={20} color="var(--ds-primary)" />
                      ) : (
                        <Text size="xs" c="dimmed">
                          {isSwitching ? "Signing in..." : "Switch"}
                        </Text>
                      )}
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Modal>
    </Box>
  );
}
