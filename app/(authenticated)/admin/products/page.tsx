"use client";

import {
  ActionIcon,
  Box,
  Chip,
  ColorSwatch,
  Container,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
  Title
} from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { BackButton } from "@/components/navigation/BackButton";
import { CollectionList } from "@/components/ui/collection-list";
import type { Header } from "@/components/ui/vtable-types";
import type { AnyItem } from "@/lib/buildpad/types";
import { Input } from "@/components/ui/input";
import {
  productReferenceHex,
  productReferenceLabLabel
} from "@/lib/qc/lab-swatch";
import {
  buildProductListFilter,
  type ProductActiveFilter,
  type ProductCategoryFilter
} from "@/lib/qc/product-search";

const CATEGORY_OPTIONS: Array<{
  label: string;
  value: ProductCategoryFilter;
}> = [
  { label: "All categories", value: "all" },
  { label: "Essential oil", value: "essential_oil" },
  { label: "Aromatic chemical", value: "aromatic_chemical" },
  { label: "Natural extract", value: "natural_extract" },
  { label: "Powder", value: "powder" }
];

export default function AdminProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategoryFilter>("all");
  const [active, setActive] = useState<ProductActiveFilter>("all");

  const productFilter = useMemo(
    () => buildProductListFilter({ search, category, active }),
    [search, category, active]
  );

  const hasLocalFilters =
    search.trim().length > 0 || category !== "all" || active !== "all";

  const clearLocalFilters = () => {
    setSearch("");
    setCategory("all");
    setActive("all");
  };

  const renderProductCell = useCallback(
    (item: AnyItem, header: Header) => {
      if (header.value !== "rgb_approx") return null;

      const hex = productReferenceHex(item);
      const labLabel = productReferenceLabLabel(item);
      if (!hex) {
        return (
          <Text c="dimmed" size="sm">
            No Lab
          </Text>
        );
      }

      return (
        <Group gap="xs" wrap="nowrap">
          <Tooltip label={labLabel ?? "Reference Lab unavailable"} openDelay={300}>
            <ColorSwatch color={hex} size={22} />
          </Tooltip>
          <Text ff="monospace" size="sm">
            {hex}
          </Text>
        </Group>
      );
    },
    []
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <BackButton />
        <Box
          style={{
            borderBottom: "1px solid var(--ds-border-color)",
            paddingBottom: "var(--ds-spacing-4)"
          }}
        >
          <Title order={1}>Product References</Title>
          <Text c="dimmed">
            Admin-only product reference management. Reference changes are
            versioned by the backend workflow.
          </Text>
        </Box>

        <Stack gap="sm">
          <Group gap="sm" align="flex-end">
            <Box style={{ flex: "1 1 280px" }}>
              <Input
                value={search}
                onChange={(value) =>
                  setSearch(typeof value === "string" ? value : "")
                }
                placeholder="Search name, code, or SKU"
                iconLeft={<IconSearch size={16} />}
                iconRight={
                  search ? (
                    <ActionIcon
                      aria-label="Clear product search"
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
              aria-label="Active filter"
              color="primary"
              data={[
                { label: "All products", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" }
              ]}
              onChange={(value) => setActive(value as ProductActiveFilter)}
              value={active}
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
            onChange={(value) =>
              setCategory((value || "all") as ProductCategoryFilter)
            }
            value={category}
          >
            <Group gap="xs">
              {CATEGORY_OPTIONS.map((option) => (
                <Chip key={option.value} value={option.value}>
                  {option.label}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Stack>

        <CollectionList
          collection="products"
          fields={[
            "name",
            "code",
            "sku",
            "category",
            "ref_l",
            "ref_a",
            "ref_b",
            "rgb_approx",
            "delta_e_max",
            "warning_margin",
            "active"
          ]}
          filter={productFilter ?? undefined}
          limit={25}
          enableSearch={false}
          enableSort
          enableFilter
          enableCreate
          renderCell={renderProductCell}
          onCreate={() => router.push("/admin/products/new")}
          onItemClick={(item) => {
            if (item.id) router.push(`/admin/products/${String(item.id)}`);
          }}
        />
      </Stack>
    </Container>
  );
}
