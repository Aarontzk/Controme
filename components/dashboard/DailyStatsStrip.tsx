"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";

import {
  latestStat,
  rejectRateTrend,
  type QcDailyStatRow,
} from "@/lib/dashboard/qc-daily-stats";

async function fetchDailyStats(): Promise<QcDailyStatRow[]> {
  const response = await fetch(
    "/api/items/qc_daily_stats?limit=14&sort=-stat_date",
    { credentials: "include", cache: "no-store" }
  );
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: QcDailyStatRow[] };
  return json.data ?? [];
}

const panelStyle = {
  background: "var(--ds-surface-white)",
  borderColor: "var(--ds-border-color)",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fz="lg" fw={700}>
        {value}
      </Text>
    </Stack>
  );
}

export function DailyStatsStrip() {
  const [rows, setRows] = useState<QcDailyStatRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    void fetchDailyStats().then((next) => {
      setRows(next);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const latest = useMemo(() => latestStat(rows), [rows]);
  const trend = useMemo(() => rejectRateTrend(rows, 14), [rows]);

  return (
    <Paper withBorder p="md" radius="md" style={panelStyle}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700}>Daily QC rollup</Text>
          <Badge variant="outline" color="primary">
            precomputed
          </Badge>
        </Group>

        {!loaded ? (
          <Text c="dimmed">Loading…</Text>
        ) : latest == null ? (
          <Text c="dimmed">
            No rollup yet — the qc-daily-stats cron writes one row per day.
          </Text>
        ) : (
          <>
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <Metric label="Latest day" value={String(latest.stat_date)} />
              <Metric label="Lots" value={String(latest.total_lots ?? 0)} />
              <Metric
                label="Reject rate"
                value={`${Math.round((latest.reject_rate ?? 0) * 100)}%`}
              />
              <Metric
                label="Avg ΔE"
                value={
                  latest.avg_delta_e != null
                    ? Number(latest.avg_delta_e).toFixed(2)
                    : "—"
                }
              />
            </SimpleGrid>

            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                Reject rate — last {trend.length} day(s)
              </Text>
              {trend.map((point) => (
                <Group key={point.date} align="center" gap="sm">
                  <Text w={92} size="xs" c="dimmed">
                    {point.date}
                  </Text>
                  <Progress
                    flex={1}
                    value={point.rejectRate * 100}
                    color={point.rejectRate >= 0.15 ? "danger" : "success"}
                  />
                  <Text w={48} ta="right" size="sm">
                    {Math.round(point.rejectRate * 100)}%
                  </Text>
                </Group>
              ))}
            </Stack>
          </>
        )}

        <Text size="xs" c="dimmed">
          Read from qc_daily_stats — one row/day, so this view never scans the
          full qc_lots table.
        </Text>
      </Stack>
    </Paper>
  );
}
