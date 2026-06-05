"use client";

import { Container, Stack, Text, Title } from "@mantine/core";

import { ColorQcCapture } from "@/components/vision/ColorQcCapture";
import { REFERENCE_PRODUCTS } from "@/lib/domain";

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
        <ColorQcCapture defaultProductId={REFERENCE_PRODUCTS[0]?.id} />
      </Stack>
    </Container>
  );
}
