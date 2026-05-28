import { Container, Stack, Text, Title } from "@mantine/core";

export default function AdminProductsPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="sm">
        <Title order={1}>Product References</Title>
        <Text c="dimmed">
          Admin product reference management dan version history akan diisi
          pada F5.
        </Text>
      </Stack>
    </Container>
  );
}
