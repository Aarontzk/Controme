"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

import {
  ageMinutes,
  healthLabel,
  healthTone,
  latestSample,
  type HealthTone,
  type SystemHealthRow,
} from "@/lib/dashboard/system-health";

async function fetchHealth(): Promise<SystemHealthRow[]> {
  const response = await fetch(
    "/api/items/system_health?limit=1&sort=-checked_at",
    { credentials: "include", cache: "no-store" }
  );
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: SystemHealthRow[] };
  return json.data ?? [];
}

function toneColor(tone: HealthTone): string {
  if (tone === "ok") return "success";
  if (tone === "warn") return "warning";
  return "danger";
}

function panelStyle(tone: HealthTone) {
  if (tone === "ok") {
    return {
      background: "var(--ds-status-pass-bg)",
      borderColor: "var(--ds-status-pass-border)",
    };
  }
  if (tone === "warn") {
    return {
      background: "var(--ds-status-warning-bg)",
      borderColor: "var(--ds-status-warning-border)",
    };
  }
  return {
    background: "var(--ds-status-reject-bg)",
    borderColor: "var(--ds-status-reject-border)",
  };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={700}>{value}</Text>
    </Stack>
  );
}

function minuteLabel(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value < 60) return `${value} min ago`;
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return mins ? `${hours}h ${mins}m ago` : `${hours}h ago`;
}

export function SystemHealthWidget() {
  const [rows, setRows] = useState<SystemHealthRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    void fetchHealth().then((next) => {
      setRows(next);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const sample = useMemo(() => latestSample(rows), [rows]);
  const tone = useMemo(() => healthTone(sample), [sample]);
  const beatAge = sample ? ageMinutes(sample.checked_at) : null;

  return (
    <Paper withBorder p="md" radius="md" style={panelStyle(tone)}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700}>System health</Text>
          <Badge color={toneColor(tone)} variant="filled">
            {loaded ? healthLabel(tone) : "…"}
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Metric
            label="Last heartbeat"
            value={loaded ? minuteLabel(beatAge) : "…"}
          />
          <Metric
            label="DaaS latency"
            value={sample?.latency_ms != null ? `${sample.latency_ms} ms` : "—"}
          />
          <Metric
            label="Lots / 24h"
            value={sample?.detail?.lots_24h != null ? String(sample.detail.lots_24h) : "—"}
          />
          <Metric
            label="Newest lot"
            value={minuteLabel(sample?.detail?.last_lot_age_min)}
          />
        </SimpleGrid>

        <Text size="xs" c="dimmed">
          Sampled every 10 min by the qc-heartbeat cron. A missing heartbeat for
          over 30 min is reported as down.
        </Text>
      </Stack>
    </Paper>
  );
}
