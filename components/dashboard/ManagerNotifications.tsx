"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Badge,
  Button,
  Chip,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Stack,
  Text,
} from "@mantine/core";

import {
  filterNotifications,
  isBriefNotification,
  kindCounts,
  levelTone,
  parseBrief,
  sortNotifications,
  unreadCount,
  type NotificationKind,
  type NotificationTone,
  type QcNotificationRow,
} from "@/lib/dashboard/notifications";

interface NotificationsResponse {
  data?: QcNotificationRow[];
}

async function fetchNotifications(): Promise<QcNotificationRow[]> {
  const response = await fetch(
    "/api/items/qc_notifications?limit=30&sort=-date_created",
    { credentials: "include", cache: "no-store" }
  );
  if (!response.ok) return [];
  const json = (await response.json()) as NotificationsResponse;
  return json.data ?? [];
}

function toneColor(tone: NotificationTone): string {
  if (tone === "reject") return "danger";
  if (tone === "warning") return "warning";
  return "primary";
}

function cardStyle(tone: NotificationTone, read: boolean) {
  const base =
    tone === "reject"
      ? {
          background: "var(--ds-status-reject-bg)",
          borderColor: "var(--ds-status-reject-border)",
        }
      : tone === "warning"
        ? {
            background: "var(--ds-status-warning-bg)",
            borderColor: "var(--ds-status-warning-border)",
          }
        : {
            background: "var(--ds-surface-white)",
            borderColor: "var(--ds-border-color)",
          };
  return { ...base, opacity: read ? 0.6 : 1 };
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

interface NotificationCardProps {
  row: QcNotificationRow;
  onMarkRead: (id: string) => void;
}

function NotificationCard({ row, onMarkRead }: NotificationCardProps) {
  const tone = levelTone(row.level);
  const brief = parseBrief(row.message);
  const read = Boolean(row.read);

  return (
    <Paper withBorder p="md" radius="md" style={cardStyle(tone, read)}>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs">
            <Badge color={toneColor(tone)} variant="filled">
              {(row.level ?? "info").toUpperCase()}
            </Badge>
            {isBriefNotification(row) ? (
              <Badge color="primary" variant="outline">
                brief
              </Badge>
            ) : null}
            {!read ? (
              <Badge color="cta" variant="dot">
                unread
              </Badge>
            ) : null}
          </Group>
          <Text size="xs" c="dimmed">
            {formatTime(row.date_created)}
          </Text>
        </Group>

        <Text fw={700}>{brief.title}</Text>
        {brief.summary ? (
          <Text size="sm" c="dimmed">
            {brief.summary}
          </Text>
        ) : null}
        {brief.body ? (
          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
            {brief.body}
          </Text>
        ) : null}

        {brief.links.length > 0 ? (
          <Group gap="xs">
            {brief.links.map((link) => (
              <Anchor key={link} component={Link} href={link} size="sm">
                {link}
              </Anchor>
            ))}
          </Group>
        ) : null}

        {!read ? (
          <Group justify="flex-end">
            <Button
              variant="light"
              size="xs"
              color="primary"
              onClick={() => onMarkRead(row.id)}
            >
              Mark read
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Paper>
  );
}

export function ManagerNotifications() {
  const [rows, setRows] = useState<QcNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<NotificationKind>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const refresh = useCallback(() => {
    void fetchNotifications().then((next) => {
      setRows(next);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const counts = useMemo(() => kindCounts(rows), [rows]);
  const visible = useMemo(
    () => sortNotifications(filterNotifications(rows, kind, unreadOnly)),
    [rows, kind, unreadOnly]
  );
  const unread = useMemo(() => unreadCount(rows), [rows]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic — flip locally first, then persist through the proxy.
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, read: true } : row))
    );
    try {
      await fetch(`/api/items/qc_notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ read: true }),
      });
    } catch {
      // Leave the optimistic state; the next 15s poll reconciles with DaaS.
    }
  }, []);

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{
        background: "var(--ds-surface-white)",
        borderColor: "var(--ds-border-color)",
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <Text fw={700}>QC briefs &amp; alerts</Text>
            {unread > 0 ? (
              <Badge color="cta" variant="filled">
                {unread} unread
              </Badge>
            ) : null}
          </Group>
          <Button
            variant="light"
            color="cta"
            size="xs"
            onClick={refresh}
          >
            Refresh
          </Button>
        </Group>

        <Group justify="space-between" gap="xs" wrap="wrap">
          <SegmentedControl
            size="xs"
            value={kind}
            onChange={(value) => setKind(value as NotificationKind)}
            data={[
              { label: `All (${counts.all})`, value: "all" },
              { label: `Brief (${counts.brief})`, value: "brief" },
              { label: `Alert (${counts.alert})`, value: "alert" },
              { label: `Warning (${counts.warning})`, value: "warning" },
            ]}
          />
          <Chip
            size="xs"
            color="cta"
            variant="outline"
            checked={unreadOnly}
            onChange={setUnreadOnly}
          >
            Unread only
          </Chip>
        </Group>

        {loading ? (
          <Group justify="center" py="md">
            <Loader size="sm" />
          </Group>
        ) : visible.length === 0 ? (
          <Text c="dimmed">
            {counts.all === 0
              ? "No briefs or alerts yet."
              : "No items match this filter."}
          </Text>
        ) : (
          visible.map((row) => (
            <NotificationCard key={row.id} row={row} onMarkRead={markRead} />
          ))
        )}
      </Stack>
    </Paper>
  );
}
