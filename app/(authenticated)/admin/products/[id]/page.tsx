"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, Container, Paper, Stack, Text, Title } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";

import { ProductReferenceAssistant } from "@/components/admin/ProductReferenceAssistant";
import { CollectionForm } from "@/components/ui/collection-form";
import { CollectionList } from "@/components/ui/collection-list";
import { isNewItem } from "@/lib/buildpad/utils";
import {
  DEFAULT_PRODUCT_REFERENCE_VALUES,
  type ProductReferenceValues,
} from "@/lib/vision/reference-assistant";

const surfaceStyle = {
  background: "var(--ds-surface-white)",
  borderColor: "var(--ds-border-color)"
};

const PRODUCT_METADATA_FIELDS = ["name", "sku", "category", "active"];

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const isNew = isNewItem(id);
  const [referenceValues, setReferenceValues] = useState<ProductReferenceValues>(
    DEFAULT_PRODUCT_REFERENCE_VALUES
  );
  const [formRevision, setFormRevision] = useState(0);

  const newProductDefaults = useMemo(
    () => ({
      ...referenceValues,
      active: true,
      version: 1,
    }),
    [referenceValues]
  );

  const handleReferenceDraftChange = useCallback((values: ProductReferenceValues) => {
    setReferenceValues(values);
    setFormRevision((current) => current + 1);
  }, []);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Box
          style={{
            borderBottom: "1px solid var(--ds-border-color)",
            paddingBottom: "var(--ds-spacing-4)"
          }}
        >
          <Title order={1}>{isNew ? "New Product" : "Edit Product"}</Title>
          <Text c="dimmed">
            Product reference values drive the server-authoritative QC verdict.
          </Text>
        </Box>
        <ProductReferenceAssistant
          mode={isNew ? "create" : "edit"}
          productId={isNew ? undefined : id}
          onDraftChange={handleReferenceDraftChange}
        />
        <Paper withBorder p="md" radius="md" style={surfaceStyle}>
          <CollectionForm
            key={isNew ? `new-product-${formRevision}` : `edit-product-${id}`}
            collection="products"
            id={isNew ? undefined : id}
            mode={isNew ? "create" : "edit"}
            defaultValues={isNew ? newProductDefaults : undefined}
            includeFields={PRODUCT_METADATA_FIELDS}
            onSuccess={(item) => {
              const nextId = item?.id ? String(item.id) : id;
              router.push(`/admin/products/${nextId}`);
              router.refresh();
            }}
          />
        </Paper>
        {!isNew ? (
          <Paper withBorder p="md" radius="md" style={surfaceStyle}>
            <Stack gap="sm">
              <Text fw={700}>Reference version history</Text>
              <CollectionList
                collection="product_reference_versions"
                fields={[
                  "date_created",
                  "ref_l",
                  "ref_a",
                  "ref_b",
                  "delta_e_max",
                  "user_created",
                  "reason"
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
