"use client";

import { Container, Stack, Text, Title } from "@mantine/core";
import { useRouter } from "next/navigation";

import { CollectionList } from "@/components/ui/collection-list";

export default function AdminProductsPage() {
  const router = useRouter();

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Product References</Title>
          <Text c="dimmed">
            Admin-only product reference management. Reference changes are
            versioned by the backend workflow.
          </Text>
        </div>
        <CollectionList
          collection="products"
          fields={[
            "name",
            "sku",
            "category",
            "ref_l",
            "ref_a",
            "ref_b",
            "delta_e_max",
            "warning_margin",
            "active",
          ]}
          limit={25}
          enableSearch
          enableSort
          enableFilter
          enableCreate
          onCreate={() => router.push("/admin/products/new")}
          onItemClick={(item) => {
            if (item.id) router.push(`/admin/products/${String(item.id)}`);
          }}
        />
      </Stack>
    </Container>
  );
}
