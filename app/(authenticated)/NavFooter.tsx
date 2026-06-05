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
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
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

interface NavFooterProps {
  roles: string[];
}

export function NavFooter({ roles }: NavFooterProps) {
  const [loading, setLoading] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [recentAccounts, setRecentAccounts] =
    useState<RecentAccount[]>(getRecentAccounts);

  const primary = roles[0];
  const roleLabel = primary ? ROLE_LABELS[primary] ?? primary : "Account";

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
        if (!email || !active) return;

        setCurrentEmail(email);
      } catch {
        // Recent account storage is an enhancement; ignore failures.
      }
    }

    void loadCurrentUser();
    return () => {
      active = false;
    };
  }, []);

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
      // Stay on the normal login redirect when logout cannot return JSON.
    }
    // Hard navigation clears all authenticated client state on the way out.
    window.location.assign(next);
  }

  async function switchAccount(accountId: string): Promise<void> {
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

      const data = await response.json().catch(() => null) as {
        errors?: { message?: string }[];
      } | null;

      if (!response.ok) {
        throw new Error(data?.errors?.[0]?.message ?? "Failed to switch account");
      }

      setCurrentEmail(account.email);
      setSwitcherOpen(false);
      // Hard reload to "/" so the new session's role, nav gating, and every
      // client-side fetch (useAppRoles, dashboards) re-initialise cleanly.
      // router.refresh() only re-runs server components and leaves cached
      // client state showing the previous account until a manual reload.
      window.location.assign("/");
      return;
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
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // The login page can still replace the session if logout response fails.
    } finally {
      // Hard navigation so no stale authenticated client state survives.
      window.location.assign(
        `/login?email=${encodeURIComponent(email)}&remember=1`
      );
    }
  }

  const demoAccountsByEmail = useMemo(() => {
    return new Map(DEMO_ACCOUNTS.map((account) => [account.email.toLowerCase(), account]));
  }, []);

  const manualRecentAccounts = recentAccounts.filter(
    (account) => !demoAccountsByEmail.has(account.email.toLowerCase()),
  );

  return (
    <>
      <Box
        mt="auto"
        style={{
          flexShrink: 0,
          paddingTop: "var(--ds-spacing-3)",
        }}
      >
        <Box
          style={{
            background:
              "color-mix(in srgb, var(--mantine-color-body) 88%, transparent)",
            border: "1px solid var(--ds-border-color)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
            padding: "var(--ds-spacing-3)",
          }}
        >
          <Group gap="sm" wrap="nowrap" mb="var(--ds-spacing-3)">
            <Avatar
              color="primary"
              radius="xl"
              size={38}
              style={{
                border:
                  "1px solid color-mix(in srgb, var(--ds-primary) 18%, transparent)",
              }}
            >
              {roleLabel.slice(0, 1).toUpperCase()}
            </Avatar>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text size="sm" fw={700} truncate>
                {roleLabel}
              </Text>
              <Text size="xs" c="dimmed">
                Signed in
              </Text>
            </Stack>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <Button
              variant="light"
              color="primary"
              size="xs"
              fullWidth
              radius={8}
              leftSection={<IconUserCircle size={15} />}
              loading={Boolean(switchingId)}
              onClick={() => {
                setRecentAccounts(getRecentAccounts());
                setSwitcherOpen(true);
              }}
              styles={{
                root: {
                  fontWeight: 650,
                  transition: "background 150ms ease, transform 150ms ease",
                },
                section: { marginRight: 6 },
              }}
            >
              Switch account
            </Button>
            <Button
              variant="subtle"
              color="red"
              size="xs"
              fullWidth
              radius={8}
              leftSection={<IconLogout size={15} />}
              loading={loading}
              onClick={logout}
              styles={{
                root: {
                  fontWeight: 650,
                  transition: "background 150ms ease, transform 150ms ease",
                },
                section: { marginRight: 6 },
              }}
            >
              Sign out
            </Button>
          </Group>
        </Box>
      </Box>

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
                const isCurrent = account.email === currentEmail?.toLowerCase();

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
              const isCurrent =
                account.id === primary ||
                account.email.toLowerCase() === currentEmail?.toLowerCase();
              const isSwitching = switchingId === account.id;

              return (
                <UnstyledButton
                  key={account.id}
                  onClick={() => void switchAccount(account.id)}
                  disabled={Boolean(switchingId)}
                  style={{
                    border: isCurrent
                      ? "1px solid var(--ds-primary)"
                      : "1px solid var(--ds-border-color)",
                    borderRadius: 8,
                    padding: "var(--ds-spacing-3)",
                    transition:
                      "background 150ms ease, border-color 150ms ease, transform 150ms ease",
                    width: "100%",
                    background: isCurrent
                      ? "color-mix(in srgb, var(--ds-primary) 8%, var(--mantine-color-body))"
                      : "var(--mantine-color-body)",
                    cursor: switchingId ? "not-allowed" : "pointer",
                    opacity: switchingId && !isSwitching ? 0.62 : 1,
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
    </>
  );
}
