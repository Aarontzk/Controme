import { Container, Stack, Text, Title } from "@mantine/core";

export default function ManagerDashboardPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="sm">
        <Title order={1}>Manager Dashboard</Title>
        <Text c="dimmed">
          Pass rate, trend Delta E, lot REJECT, dan warning band akan diisi
          pada F4.
        </Text>
      </Stack>
    </Container>
  );
}
