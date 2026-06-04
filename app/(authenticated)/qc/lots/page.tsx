"use client";

import {
  ActionIcon,
  Box,
  Chip,
  Container,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CollectionList } from "@/components/ui/collection-list";
import { Input } from "@/components/ui/input";
import {
  buildLotHistoryFilter,
  type LotStatusFilter,
  type LotWarningFilter
} from "@/lib/qc/lot-search";

export default function QcLotsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LotStatusFilter>("all");
  const [warningFlag, setWarningFlag] = useState<LotWarningFilter>("all");

  const lotFilter = useMemo(
    () => buildLotHistoryFilter({ search, status, warningFlag }),
    [search, status, warningFlag]
  );

  const hasLocalFilters =
    search.trim().length > 0 || status !== "all" || warningFlag !== "all";

  const clearLocalFilters = () => {
    setSearch("");
    setStatus("all");
    setWarningFlag("all");
  };

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

        <Stack gap="sm">
          <Group gap="sm" align="flex-end">
            <Box style={{ flex: "1 1 280px" }}>
              <Input
                value={search}
                onChange={(value) => setSearch(typeof value === "string" ? value : "")}
                placeholder="Search lot code or product name"
                iconLeft={<IconSearch size={16} />}
                iconRight={
                  search ? (
                    <ActionIcon
                      aria-label="Clear lot search"
                      onClick={() => setSearch("")}
                      size="sm"
                      variant="subtle"
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  ) : undefined
                }
              />
            </Box>
            <SegmentedControl
              aria-label="Status filter"
              data={[
                { label: "All statuses", value: "all" },
                { label: "Pass", value: "pass" },
                { label: "Reject", value: "reject" }
              ]}
              onChange={(value) => setStatus(value as LotStatusFilter)}
              value={status}
            />
            {hasLocalFilters ? (
              <ActionIcon
                aria-label="Clear search and filters"
                onClick={clearLocalFilters}
                size="lg"
                variant="subtle"
              >
                <IconX size={18} />
              </ActionIcon>
            ) : null}
          </Group>

          <Chip.Group
            multiple={false}
            onChange={(value) => setWarningFlag((value || "all") as LotWarningFilter)}
            value={warningFlag}
          >
            <Group gap="xs">
              <Chip value="all">All lots</Chip>
              <Chip value="warning">Warning only</Chip>
              <Chip value="clear">Clear only</Chip>
            </Group>
          </Chip.Group>
        </Stack>

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
          filter={lotFilter ?? undefined}
          limit={25}
          enableSearch={false}
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
