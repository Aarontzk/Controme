"use client";

import { Container, Stack, Text, Title } from "@mantine/core";

import { ColorQcCapture } from "@/components/vision/ColorQcCapture";

export default function VisionPocPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Vision QC PoC</Title>
          <Text c="dimmed">
            Browser-only color sampling from an uploaded image.
          </Text>
        </div>
        <ColorQcCapture />
      </Stack>
    </Container>
  );
}
