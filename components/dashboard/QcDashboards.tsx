"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import {
  aggregatePassRates,
  buildDeltaTrend,
  getRejectedOrWarning,
  summarizeClearance,
  type QcLotAnalyticsRow
} from "@/lib/dashboard/qc-analytics";
import { ManagerAiAssistant } from "./ManagerAiAssistant";

async function fetchLots(): Promise<QcLotAnalyticsRow[]> {
  const response = await fetch("/api/items/qc_lots?limit=200&sort=-checked_at", {
    credentials: "include",
    cache: "no-store"
  });
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: QcLotAnalyticsRow[] };
  return json.data ?? [];
}

function statusColor(status: string | null | undefined): string {
  if (status === "pass") return "success";
  if (status === "reject") return "danger";
  return "warning";
}

function panelStyle(tone: "neutral" | "pass" | "reject" | "warning" = "neutral") {
  if (tone === "pass") {
    return {
      background: "var(--ds-status-pass-bg)",
      borderColor: "var(--ds-status-pass-border)"
    };
  }
  if (tone === "reject") {
    return {
      background: "var(--ds-status-reject-bg)",
      borderColor: "var(--ds-status-reject-border)"
    };
  }
  if (tone === "warning") {
    return {
      background: "var(--ds-status-warning-bg)",
      borderColor: "var(--ds-status-warning-border)"
    };
  }
  return {
    background: "var(--ds-surface-white)",
    borderColor: "var(--ds-border-color)"
  };
}

function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string | number;
  tone?: "pass" | "reject" | "warning";
}) {
  return (
    <Paper withBorder p="md" radius="md" style={panelStyle(tone)}>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fz="xl" fw={700}>
        {value}
      </Text>
    </Paper>
  );
}

export function PpicDashboard() {
  const [rows, setRows] = useState<QcLotAnalyticsRow[]>([]);

  useEffect(() => {
    void fetchLots().then(setRows);
    const interval = window.setInterval(() => {
      void fetchLots().then(setRows);
    }, 4_000);
    return () => window.clearInterval(interval);
  }, []);

  const summary = useMemo(() => summarizeClearance(rows), [rows]);
  const recent = rows.slice(0, 8);

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <MetricCard label="Pending QC" value={summary.pending} tone="warning" />
        <MetricCard label="QC-cleared" value={summary.cleared} tone="pass" />
        <MetricCard label="Rejected" value={summary.rejected} tone="reject" />
      </SimpleGrid>
      <Paper withBorder p="md" radius="md" style={panelStyle()}>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={700}>Recent clearance</Text>
            <Badge variant="outline" color="primary">
              refetch every 4s
            </Badge>
          </Group>
          {recent.map((row) => (
            <Group key={row.id} justify="space-between">
              <Text fw={600}>{row.lot_code || row.id}</Text>
              <Badge color={statusColor(row.status)} variant="outline">
                {row.status ?? "pending"}
              </Badge>
            </Group>
          ))}
          {recent.length === 0 ? <Text c="dimmed">No lots available.</Text> : null}
        </Stack>
      </Paper>
    </Stack>
  );
}

export function ManagerDashboard() {
  const [rows, setRows] = useState<QcLotAnalyticsRow[]>([]);

  useEffect(() => {
    void fetchLots().then((nextRows) => {
      setRows(nextRows);
      const flagged = getRejectedOrWarning(nextRows)[0];
      if (flagged) {
        notifications.show({
          title: flagged.status === "reject" ? "Rejected lot" : "Warning lot",
          message: flagged.lot_code || flagged.id,
          color: flagged.status === "reject" ? "danger" : "warning"
        });
      }
    });
  }, []);

  const passRates = useMemo(() => aggregatePassRates(rows), [rows]);
  const trend = useMemo(() => buildDeltaTrend(rows), [rows]);
  const flagged = useMemo(() => getRejectedOrWarning(rows).slice(0, 8), [rows]);
  const maxDelta = Math.max(1, ...trend.map((point) => point.deltaE));

  return (
    <Stack gap="lg">
      <ManagerAiAssistant rows={rows} />
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {passRates.map((rate) => (
          <Paper key={rate.productId} withBorder p="md" radius="md" style={panelStyle()}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={700}>{rate.productName}</Text>
                <Badge
                  color={rate.passRate >= 0.8 ? "success" : "warning"}
                  variant="outline"
                >
                  {(rate.passRate * 100).toFixed(0)}%
                </Badge>
              </Group>
              <Progress value={rate.passRate * 100} color="success" />
              <Text size="sm" c="dimmed">
                {rate.pass} pass / {rate.reject} reject / {rate.total} total
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder p="md" radius="md" style={panelStyle()}>
        <Stack gap="sm">
          <Text fw={700}>Delta E trend</Text>
          {trend.map((point) => (
            <Group key={point.label} align="center">
              <Text w={120} size="sm" truncate>
                {point.label}
              </Text>
              <Progress flex={1} value={(point.deltaE / maxDelta) * 100} color="primary" />
              <Text size="sm">{point.deltaE.toFixed(2)}</Text>
            </Group>
          ))}
          {trend.length === 0 ? <Text c="dimmed">No trend data available.</Text> : null}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md" style={panelStyle()}>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={700}>Rejects and warnings</Text>
            <Button
              variant="light"
              color="cta"
              size="xs"
              onClick={() => void fetchLots().then(setRows)}
            >
              Refresh
            </Button>
          </Group>
          {flagged.map((row) => (
            <Group key={row.id} justify="space-between">
              <Text fw={600}>{row.lot_code || row.id}</Text>
              <Group gap="xs">
                {row.warning_flag ? (
                  <Badge color="warning" variant="outline">
                    warning
                  </Badge>
                ) : null}
                <Badge color={statusColor(row.status)} variant="outline">
                  {row.status}
                </Badge>
              </Group>
            </Group>
          ))}
          {flagged.length === 0 ? <Text c="dimmed">No rejects or warnings.</Text> : null}
        </Stack>
      </Paper>
    </Stack>
  );
}
