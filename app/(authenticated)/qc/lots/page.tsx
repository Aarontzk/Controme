"use client";

import { Box, Container, Stack, Text, Title } from "@mantine/core";
import { useRouter } from "next/navigation";

import { CollectionList } from "@/components/ui/collection-list";

export default function QcLotsPage() {
  const router = useRouter();

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Box
          style={{
            borderBottom: "1px solid var(--ds-border-color)",
            paddingBottom: "var(--ds-spacing-4)"
          }}
        >
          <Title order={1}>QC Lot History</Title>
          <Text c="dimmed">
            Immutable QC records. Every check is logged with its server-computed
            {" \u0394E"}, verdict, and audit trail.
          </Text>
        </Box>
        <CollectionList
          collection="qc_lots"
          fields={[
            "lot_code",
            "qc_stage",
            "checked_at",
            "product_id",
            "status",
            "warning_flag",
            "delta_e",
            "reject_reason",
            "operator_id"
          ]}
          limit={25}
          enableSearch
          enableSort
          enableFilter
          onItemClick={(item) => {
            if (item.id) router.push(`/qc/lots/${String(item.id)}`);
          }}
        />
      </Stack>
    </Container>
  );
}
