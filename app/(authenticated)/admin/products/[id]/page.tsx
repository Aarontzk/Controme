"use client";

import { Container, Paper, Stack, Text, Title } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";

import { CollectionForm } from "@/components/ui/collection-form";
import { CollectionList } from "@/components/ui/collection-list";

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const isNew = id === "new";

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>{isNew ? "New Product" : "Edit Product"}</Title>
          <Text c="dimmed">
            Product reference values drive the server-authoritative QC verdict.
          </Text>
        </div>
        <Paper withBorder p="md" radius="md">
          <CollectionForm
            collection="products"
            id={isNew ? undefined : id}
            mode={isNew ? "create" : "edit"}
            onSuccess={(item) => {
              const nextId = item?.id ? String(item.id) : id;
              router.push(`/admin/products/${nextId}`);
              router.refresh();
            }}
          />
        </Paper>
        {!isNew ? (
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Text fw={700}>Reference version history</Text>
              <CollectionList
                collection="product_reference_versions"
                fields={[
                  "changed_at",
                  "ref_l",
                  "ref_a",
                  "ref_b",
                  "delta_e_max",
                  "changed_by",
                  "reason",
                ]}
                filter={{ product_id: { _eq: id } }}
                limit={10}
                enableSort
              />
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  );
}
