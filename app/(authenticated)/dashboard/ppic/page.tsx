import { Container, Stack, Text, Title } from "@mantine/core";

export default function PpicDashboardPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="sm">
        <Title order={1}>PPIC Dashboard</Title>
        <Text c="dimmed">
          Clearance lot real-time untuk pending QC, QC-cleared, dan rejected
          akan diisi pada F4.
        </Text>
      </Stack>
    </Container>
  );
}
