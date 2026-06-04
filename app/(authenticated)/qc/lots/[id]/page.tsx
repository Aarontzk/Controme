import {
  Anchor,
  Badge,
  Box,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LotExportActions } from "@/components/export/LotExportActions";
import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";

type QcLotDetail = {
  id: string;
  lot_code?: string | null;
  qc_stage?: "incoming" | "finish" | null;
  checked_at?: string | null;
  product_id?: string | { id?: string; name?: string } | null;
  l_value?: number | null;
  a_value?: number | null;
  b_value?: number | null;
  delta_e?: number | null;
  status?: "pass" | "reject" | null;
  warning_flag?: boolean | null;
  channel_flags?: Array<{
    channel: string;
    direction: string;
    value: number;
    reference: number;
    tolerance: number;
  }> | null;
  contaminant_ratio?: number | null;
  brightness_stddev?: number | null;
  texture_contrast?: number | null;
  reject_reason?: string | null;
  photo?: string | { id?: string } | null;
  operator_id?: string | { id?: string; email?: string } | null;
  note?: string | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatNumber(value: number | null | undefined, digits = 2): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "-";
}

// QC operates on Asia/Jakarta (WIB) — format deterministically in that zone so
// the record reads the same regardless of where the page is rendered.
function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const formatted = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(date);
  return `${formatted} WIB`;
}

function getRelatedLabel(
  value: QcLotDetail["product_id"] | QcLotDetail["operator_id"]
): string {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if ("name" in value && value.name) return value.name;
  if ("email" in value && value.email) return value.email;
  return value.id ?? "-";
}

function getPhotoId(photo: QcLotDetail["photo"]): string | null {
  if (!photo) return null;
  if (typeof photo === "string") return photo;
  return photo.id ?? null;
}

function statusColor(status: "pass" | "reject"): "success" | "danger" {
  return status === "pass" ? "success" : "danger";
}

function panelStyle(tone: "neutral" | "pass" | "reject" | "warning" = "neutral") {
  if (tone === "pass") {
    return {
      background: "var(--ds-status-pass-bg)",
      borderColor: "var(--ds-status-pass-border)"
    };
  }
  if (tone === "reject") {
    return {
      background: "var(--ds-status-reject-bg)",
      borderColor: "var(--ds-status-reject-border)"
    };
  }
  if (tone === "warning") {
    return {
      background: "var(--ds-status-warning-bg)",
      borderColor: "var(--ds-status-warning-border)"
    };
  }
  return {
    background: "var(--ds-surface-white)",
    borderColor: "var(--ds-border-color)"
  };
}

async function fetchLot(id: string): Promise<QcLotDetail | null> {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return null;

  const daasUrl = getDaaSUrl();
  // Expand operator_id so the record shows the operator's account (email/name)
  // instead of a raw UUID.
  const fields =
    "*,operator_id.id,operator_id.email,operator_id.first_name,operator_id.last_name";
  const response = await fetch(
    `${daasUrl}/api/items/qc_lots/${id}?fields=${encodeURIComponent(fields)}`,
    { headers, cache: "no-store" }
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load QC lot.");

  const json = (await response.json()) as { data?: QcLotDetail };
  return json.data ?? null;
}

export default async function QcLotDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lot = await fetchLot(id);
  if (!lot) notFound();

  const photoId = getPhotoId(lot.photo);
  const status = lot.status ?? "reject";

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Anchor
          component={Link}
          href="/qc/lots"
          size="sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <IconArrowLeft size={16} />
          Back to QC Lot History
        </Anchor>

        <Paper withBorder p="md" radius="md" style={panelStyle(status)}>
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title order={1}>QC Lot Detail</Title>
              <Text c="dimmed">
                Immutable inspection record. Corrections are made by creating a
                new record, not editing this one.
              </Text>
            </Box>
            <Group gap="xs">
              <LotExportActions lotId={lot.id} />
              {lot.warning_flag ? (
                <Badge color="warning" variant="outline">
                  warning
                </Badge>
              ) : null}
              <Badge color={statusColor(status)} size="lg" variant="outline">
                {status}
              </Badge>
            </Group>
          </Group>
        </Paper>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper withBorder p="md" radius="md" style={panelStyle()}>
            {photoId ? (
              <Image
                src={`/api/assets/${photoId}`}
                alt="QC sample"
                fit="contain"
                mah={420}
              />
            ) : (
              <Text c="dimmed">No sample photo attached.</Text>
            )}
          </Paper>

          <Stack gap="md">
            <Paper withBorder p="md" radius="md" style={panelStyle()}>
              <Stack gap="xs">
                <Text fw={700}>Lot identity</Text>
                <Text>Lot code: {lot.lot_code || "—"}</Text>
                <Text>QC stage: {lot.qc_stage ?? "-"}</Text>
                <Text>Product: {getRelatedLabel(lot.product_id)}</Text>
                <Text>Operator: {getRelatedLabel(lot.operator_id)}</Text>
                <Text>Timestamp: {formatTimestamp(lot.checked_at)}</Text>
              </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md" style={panelStyle(status)}>
              <Stack gap="xs">
                <Text fw={700}>Color diagnosis</Text>
                <Text>
                  L*a*b*: L {formatNumber(lot.l_value)}, a{" "}
                  {formatNumber(lot.a_value)}, b {formatNumber(lot.b_value)}
                </Text>
                <Text>Delta E: {formatNumber(lot.delta_e)}</Text>
                {lot.channel_flags?.length ? (
                  <Stack gap="xs">
                    {lot.channel_flags.map((flag) => (
                      <Text key={`${flag.channel}-${flag.direction}`} size="sm">
                        {flag.channel} {flag.direction}:{" "}
                        {formatNumber(flag.value)} vs{" "}
                        {formatNumber(flag.reference)} +/- {flag.tolerance}
                      </Text>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm">No channel flags.</Text>
                )}
              </Stack>
            </Paper>
          </Stack>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Paper withBorder p="md" radius="md" style={panelStyle()}>
            <Text fw={700}>Contamination</Text>
            <Text>{formatNumber((lot.contaminant_ratio ?? 0) * 100, 2)}%</Text>
          </Paper>
          <Paper withBorder p="md" radius="md" style={panelStyle()}>
            <Text fw={700}>Texture std dev</Text>
            <Text>{formatNumber(lot.brightness_stddev)}</Text>
          </Paper>
          <Paper withBorder p="md" radius="md" style={panelStyle()}>
            <Text fw={700}>Texture contrast</Text>
            <Text>{formatNumber(lot.texture_contrast)}</Text>
          </Paper>
        </SimpleGrid>

        <Paper withBorder p="md" radius="md" style={panelStyle()}>
          <Stack gap="xs">
            <Text fw={700}>Decision notes</Text>
            <Text>Reject reason: {lot.reject_reason ?? "None"}</Text>
            <Text>Operator note: {lot.note || "None"}</Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
