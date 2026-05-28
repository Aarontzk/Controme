"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Group, Paper, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";

import {
  aggregatePassRates,
  buildDeltaTrend,
  getRejectedOrWarning,
  summarizeClearance,
  type QcLotAnalyticsRow,
} from "@/lib/dashboard/qc-analytics";

async function fetchLots(): Promise<QcLotAnalyticsRow[]> {
  const response = await fetch("/api/items/qc_lots?limit=200&sort=-checked_at", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: QcLotAnalyticsRow[] };
  return json.data ?? [];
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fz="xl" fw={700} c={color}>
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
        <MetricCard label="Pending QC" value={summary.pending} color="yellow" />
        <MetricCard label="QC-cleared" value={summary.cleared} color="green" />
        <MetricCard label="Rejected" value={summary.rejected} color="red" />
      </SimpleGrid>
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={700}>Recent clearance</Text>
            <Badge variant="light">refetch every 4s</Badge>
          </Group>
          {recent.map((row) => (
            <Group key={row.id} justify="space-between">
              <Text>{row.lot_code || row.id}</Text>
              <Badge color={row.status === "pass" ? "green" : "red"}>
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
          color: flagged.status === "reject" ? "red" : "yellow",
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
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {passRates.map((rate) => (
          <Paper key={rate.productId} withBorder p="md" radius="md">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={700}>{rate.productName}</Text>
                <Badge color={rate.passRate >= 0.8 ? "green" : "yellow"}>
                  {(rate.passRate * 100).toFixed(0)}%
                </Badge>
              </Group>
              <Progress value={rate.passRate * 100} color="green" />
              <Text size="sm" c="dimmed">
                {rate.pass} pass / {rate.reject} reject / {rate.total} total
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Text fw={700}>Delta E trend</Text>
          {trend.map((point) => (
            <Group key={point.label} align="center">
              <Text w={120} size="sm" truncate>
                {point.label}
              </Text>
              <Progress flex={1} value={(point.deltaE / maxDelta) * 100} />
              <Text size="sm">{point.deltaE.toFixed(2)}</Text>
            </Group>
          ))}
          {trend.length === 0 ? <Text c="dimmed">No trend data available.</Text> : null}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={700}>Rejects and warnings</Text>
            <Button variant="light" size="xs" onClick={() => void fetchLots().then(setRows)}>
              Refresh
            </Button>
          </Group>
          {flagged.map((row) => (
            <Group key={row.id} justify="space-between">
              <Text>{row.lot_code || row.id}</Text>
              <Group gap="xs">
                {row.warning_flag ? <Badge color="yellow">warning</Badge> : null}
                <Badge color={row.status === "reject" ? "red" : "green"}>
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
