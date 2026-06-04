"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Chip,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import {
  buildSpc,
  capabilityLabel,
  SPC_WINDOW,
  type CapabilityVerdict,
  type SpcInputLot,
  type SpcProductRef,
  type SpcResult,
} from "@/lib/dashboard/spc";

const VERDICT_RANK: Record<CapabilityVerdict, number> = {
  "not-capable": 0,
  marginal: 1,
  insufficient: 2,
  capable: 3,
};

function hasIssue(result: SpcResult): boolean {
  return result.verdict !== "capable" || result.violations.length > 0;
}

async function fetchJson<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: T[] };
  return json.data ?? [];
}

const panelStyle = {
  background: "var(--ds-surface-white)",
  borderColor: "var(--ds-border-color)",
};

function verdictColor(verdict: CapabilityVerdict): string {
  if (verdict === "capable") return "success";
  if (verdict === "marginal") return "warning";
  if (verdict === "not-capable") return "danger";
  return "gray";
}

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

const CHART_W = 320;
const CHART_H = 90;
const PAD_X = 6;
const PAD_Y = 8;

/** Inline I-MR control chart — points with mean, UCL and USL reference lines. */
function ControlChart({ result }: { result: SpcResult }) {
  const values = result.points.map((p) => p.deltaE);
  const yMax = Math.max(result.ucl, result.usl ?? 0, ...values, 1) * 1.1;
  const yMin = 0;

  const x = (i: number) =>
    PAD_X +
    (result.points.length <= 1
      ? 0
      : (i / (result.points.length - 1)) * (CHART_W - 2 * PAD_X));
  const y = (v: number) =>
    PAD_Y + (1 - (v - yMin) / (yMax - yMin || 1)) * (CHART_H - 2 * PAD_Y);

  const line = (value: number, color: string, dash: string) => (
    <line
      x1={PAD_X}
      x2={CHART_W - PAD_X}
      y1={y(value)}
      y2={y(value)}
      stroke={color}
      strokeWidth={1}
      strokeDasharray={dash}
    />
  );

  const path = result.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.deltaE).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      style={{ width: "100%", height: "auto" }}
      role="img"
      aria-label={`Control chart for ${result.productName}`}
    >
      {result.usl != null ? line(result.usl, "var(--mantine-color-red-6)", "4 3") : null}
      {result.sigma > 0 ? line(result.ucl, "var(--mantine-color-orange-5)", "3 3") : null}
      {line(result.mean, "var(--mantine-color-gray-5)", "0")}
      <path d={path} fill="none" stroke="var(--mantine-color-blue-5)" strokeWidth={1.5} />
      {result.points.map((p, i) => (
        <circle
          key={p.label + i}
          cx={x(i)}
          cy={y(p.deltaE)}
          r={2.6}
          fill={
            p.beyondUsl
              ? "var(--mantine-color-red-6)"
              : p.beyondUcl
                ? "var(--mantine-color-orange-5)"
                : "var(--mantine-color-blue-6)"
          }
        />
      ))}
    </svg>
  );
}

function SpcCard({ result }: { result: SpcResult }) {
  return (
    <Paper withBorder p="md" radius="md" style={panelStyle}>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Text fw={700}>{result.productName}</Text>
          <Badge color={verdictColor(result.verdict)} variant="light">
            {capabilityLabel(result.verdict)}
          </Badge>
        </Group>

        <SimpleGrid cols={3}>
          <Metric
            label="Cpu"
            value={result.cpu != null ? result.cpu.toFixed(2) : "—"}
          />
          <Metric label="% in spec" value={`${Math.round(result.pctInSpec * 100)}%`} />
          <Metric label="Lots (n)" value={String(result.n)} />
        </SimpleGrid>

        <ControlChart result={result} />
        <Text size="xs" c="dimmed">
          mean {result.mean.toFixed(2)} · UCL {result.ucl.toFixed(2)}
          {result.usl != null ? ` · ΔEmax ${result.usl.toFixed(2)}` : ""}
        </Text>

        {result.violations.length > 0 ? (
          <Stack gap={4}>
            {result.violations.map((v) => (
              <Group key={v.type} gap="xs" wrap="nowrap" align="flex-start">
                <Badge
                  color={v.type === "drift" || v.type === "shift" ? "warning" : "danger"}
                  variant="dot"
                  size="sm"
                >
                  {v.type}
                </Badge>
                <Text size="xs">{v.message}</Text>
              </Group>
            ))}
          </Stack>
        ) : result.verdict === "insufficient" ? (
          <Text size="xs" c="dimmed">
            Need ≥ 8 lots for meaningful control limits.
          </Text>
        ) : (
          <Text size="xs" c="dimmed">
            In control — no SPC rule violations.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

export function SpcPanel() {
  const [lots, setLots] = useState<SpcInputLot[]>([]);
  const [products, setProducts] = useState<SpcProductRef[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    void Promise.all([
      fetchJson<SpcInputLot>("/api/items/qc_lots?limit=300&sort=-checked_at"),
      fetchJson<SpcProductRef>("/api/items/products?limit=1000"),
    ]).then(([lotRows, productRows]) => {
      setLots(lotRows);
      setProducts(productRows);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const results = useMemo(() => buildSpc(lots, products), [lots, products]);
  const [query, setQuery] = useState("");
  const [problemsOnly, setProblemsOnly] = useState(false);

  // Search by product name, optionally only problems, worst capability first.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results
      .filter((r) => (q ? r.productName.toLowerCase().includes(q) : true))
      .filter((r) => (problemsOnly ? hasIssue(r) : true))
      .sort((a, b) => {
        const byVerdict = VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict];
        if (byVerdict !== 0) return byVerdict;
        const byViolations = b.violations.length - a.violations.length;
        if (byViolations !== 0) return byViolations;
        return a.productName.localeCompare(b.productName);
      });
  }, [results, query, problemsOnly]);

  return (
    <Paper withBorder p="md" radius="md" style={panelStyle}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700}>Statistical Process Control (ΔE)</Text>
          <Badge variant="outline" color="primary">
            last {SPC_WINDOW} lots/product
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          Early warning: detect the process drifting toward the spec limit before
          a lot is rejected. Cpu &amp; control limits use a one-sided method (ΔEmax).
        </Text>

        <Group gap="xs" wrap="wrap" align="center">
          <Box style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="Search product…"
              value={query}
              onChange={(value) => setQuery(String(value ?? ""))}
              iconLeft={<IconSearch size={16} />}
              clear
            />
          </Box>
          <Chip
            size="xs"
            color="danger"
            variant="outline"
            checked={problemsOnly}
            onChange={setProblemsOnly}
          >
            Issues only
          </Chip>
          <Badge variant="light" color="gray">
            {filtered.length} products
          </Badge>
        </Group>

        {!loaded ? (
          <Text c="dimmed">Loading…</Text>
        ) : results.length === 0 ? (
          <Text c="dimmed">No ΔE data to analyze yet.</Text>
        ) : filtered.length === 0 ? (
          <Text c="dimmed">No products match the filter.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            {filtered.map((result) => (
              <SpcCard key={result.productId} result={result} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Paper>
  );
}
