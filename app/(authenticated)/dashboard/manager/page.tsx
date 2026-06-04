import { Box, Container, Stack, Text, Title } from "@mantine/core";
import { ManagerDashboard } from "@/components/dashboard/QcDashboards";
import { ManagerNotifications } from "@/components/dashboard/ManagerNotifications";
import { SystemHealthWidget } from "@/components/dashboard/SystemHealthWidget";
import { DailyStatsStrip } from "@/components/dashboard/DailyStatsStrip";
import { SpcPanel } from "@/components/dashboard/SpcPanel";

export default function ManagerDashboardPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Box
          style={{
            borderBottom: "1px solid var(--ds-border-color)",
            paddingBottom: "var(--ds-spacing-4)"
          }}
        >
          <Title order={1}>Manager Dashboard</Title>
          <Text c="dimmed">
            Pass rate, trend Delta E, lot REJECT, dan warning band.
          </Text>
        </Box>
        <SystemHealthWidget />
        <ManagerNotifications />
        <DailyStatsStrip />
        <SpcPanel />
        <ManagerDashboard />
      </Stack>
    </Container>
  );
}
