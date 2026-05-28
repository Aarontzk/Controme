"use client";

import { Container, Stack, Text, Title } from "@mantine/core";

import { CollectionList } from "@/components/ui/collection-list";

export default function QcLotsPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>QC Lot History</Title>
          <Text c="dimmed">
            Immutable QC records. Every check is logged with its server-computed
            {" ΔE"}, verdict, and audit trail.
          </Text>
        </div>
        <CollectionList
          collection="qc_lots"
          fields={[
            "checked_at",
            "product_id",
            "status",
            "delta_e",
            "reject_reason",
            "operator_id",
          ]}
          limit={25}
          enableSearch
          enableSort
          enableFilter
        />
      </Stack>
    </Container>
  );
}
