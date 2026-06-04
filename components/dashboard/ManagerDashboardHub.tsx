"use client";

import { useState, type ComponentType } from "react";
import {
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBell,
  IconCalendarStats,
  IconChartBar,
  IconChartLine,
  IconHeartbeat,
} from "@tabler/icons-react";

import { ManagerDashboard } from "./QcDashboards";
import { ManagerNotifications } from "./ManagerNotifications";
import { SystemHealthWidget } from "./SystemHealthWidget";
import { DailyStatsStrip } from "./DailyStatsStrip";
import { SpcPanel } from "./SpcPanel";

type SectionId = "notifications" | "spc" | "analytics" | "daily" | "health";

interface SectionDef {
  id: SectionId;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number | string }>;
  color: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: "notifications",
    label: "QC Briefs & Alerts",
    description: "Daily briefs + reject/warning alerts, with filters.",
    icon: IconBell,
    color: "cta",
  },
  {
    id: "spc",
    label: "Process Control (SPC)",
    description: "Control chart + Cpu — early warning before rejects.",
    icon: IconChartLine,
    color: "primary",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Pass rate per product, ΔE trend, reject & warning list.",
    icon: IconChartBar,
    color: "success",
  },
  {
    id: "daily",
    label: "Daily KPI",
    description: "Precomputed daily rollup (lots, reject rate, ΔE).",
    icon: IconCalendarStats,
    color: "warning",
  },
  {
    id: "health",
    label: "System Health",
    description: "Heartbeat, backend latency, data freshness.",
    icon: IconHeartbeat,
    color: "danger",
  },
];

function renderSection(id: SectionId) {
  switch (id) {
    case "notifications":
      return <ManagerNotifications />;
    case "spc":
      return <SpcPanel />;
    case "analytics":
      return <ManagerDashboard />;
    case "daily":
      return <DailyStatsStrip />;
    case "health":
      return <SystemHealthWidget />;
    default:
      return null;
  }
}

function SectionCard({
  section,
  onSelect,
}: {
  section: SectionDef;
  onSelect: (id: SectionId) => void;
}) {
  const Icon = section.icon;
  const [hovered, setHovered] = useState(false);
  return (
    <UnstyledButton
      onClick={() => onSelect(section.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: "100%", height: "100%", cursor: "pointer" }}
    >
      <Paper
        withBorder
        p="lg"
        radius="md"
        style={{
          height: "100%",
          background: "var(--ds-surface-white)",
          borderColor: hovered ? "var(--ds-primary)" : "var(--ds-border-color)",
          boxShadow: hovered ? "var(--mantine-shadow-md)" : "none",
          transform: hovered ? "translateY(-2px)" : "none",
          transition:
            "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
        }}
      >
        <Group align="flex-start" gap="md" wrap="nowrap">
          <ThemeIcon size={44} radius="md" color={section.color} variant="light">
            <Icon size={24} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={700}>{section.label}</Text>
            <Text size="sm" c="dimmed">
              {section.description}
            </Text>
          </Stack>
        </Group>
      </Paper>
    </UnstyledButton>
  );
}

export function ManagerDashboardHub() {
  const [active, setActive] = useState<SectionId | null>(null);

  if (active) {
    const section = SECTIONS.find((s) => s.id === active);
    return (
      <Stack gap="md">
        <Button
          variant="subtle"
          color="gray"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => setActive(null)}
          style={{ width: "fit-content" }}
        >
          Back to overview
        </Button>
        {section ? (
          <Text fw={700} fz="lg">
            {section.label}
          </Text>
        ) : null}
        {renderSection(active)}
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Select a panel to view details.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {SECTIONS.map((section) => (
          <SectionCard key={section.id} section={section} onSelect={setActive} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
