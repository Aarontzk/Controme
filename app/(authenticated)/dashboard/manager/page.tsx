import { Box, Container, Stack, Text, Title } from "@mantine/core";
import { ManagerDashboardHub } from "@/components/dashboard/ManagerDashboardHub";

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
            Select a panel: briefs &amp; alerts, SPC, analytics, daily KPI, or
            system health.
          </Text>
        </Box>
        <ManagerDashboardHub />
      </Stack>
    </Container>
  );
}
