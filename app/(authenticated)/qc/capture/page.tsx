import { Alert, Container, Stack, Text, Title } from "@mantine/core";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import {
  mapDaasProduct,
  type DaasProductRow,
  type ProductReference,
} from "@/lib/domain";
import { ColorQcCapture } from "@/components/vision/ColorQcCapture";

async function fetchProducts(): Promise<ProductReference[]> {
  const headers = await getAuthHeaders();
  if (!headers["Authorization"]) {
    return [];
  }
  const daasUrl = getDaaSUrl();
  const res = await fetch(`${daasUrl}/api/items/products?limit=200`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  const json = (await res.json()) as { data?: DaasProductRow[] };
  return (json.data ?? [])
    .filter((row) => row.active !== false)
    .map(mapDaasProduct);
}

export default async function QcCapturePage() {
  const products = await fetchProducts();

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>QC Capture</Title>
          <Text c="dimmed">
            Upload a sample photo. {"ΔE"} and the pass/reject verdict are
            recomputed and recorded server-side.
          </Text>
        </div>
        {products.length === 0 ? (
          <Alert color="yellow" variant="light">
            No products available. Seed products in DaaS or check your
            permissions.
          </Alert>
        ) : (
          <ColorQcCapture products={products} persist />
        )}
      </Stack>
    </Container>
  );
}
