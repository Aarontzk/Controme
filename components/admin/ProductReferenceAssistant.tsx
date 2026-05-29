"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Box,
  Button,
  ColorSwatch,
  Group,
  Image as MantineImage,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { Color } from "@/components/ui/color";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RgbColor } from "@/lib/domain";
import { analyzeSamplePixels, type SampleQualityMetrics } from "@/lib/vision/sample-color";
import { getCenterRoi } from "@/lib/vision/roi";
import {
  clampRgbChannel,
  DEFAULT_PRODUCT_REFERENCE_VALUES,
  DEFAULT_REFERENCE_RGB,
  hexToRgb,
  mergeReferenceValues,
  referenceValuesFromRgb,
  type ProductReferenceValues,
  updateReferenceLimit,
} from "@/lib/vision/reference-assistant";

interface ProductReferenceAssistantProps {
  mode: "create" | "edit";
  productId?: string;
  onDraftChange?: (values: ProductReferenceValues) => void;
}

interface ProductResponse {
  data?: Partial<Record<keyof ProductReferenceValues, unknown>>;
  error?: string;
  errors?: Array<{ message?: string }>;
}

const surfaceStyle: CSSProperties = {
  background: "var(--ds-surface-white)",
  borderColor: "var(--ds-border-color)",
};

const previewStyle: CSSProperties = {
  background: "var(--ds-gray-100)",
  border: "1px solid var(--ds-border-color)",
  borderRadius: "var(--mantine-radius-md)",
  minHeight: 220,
  overflow: "hidden",
};

const roiNoteStyle: CSSProperties = {
  background: "color-mix(in srgb, var(--ds-primary-muted) 72%, transparent)",
  border: "1px solid var(--ds-primary-muted)",
  borderRadius: "var(--mantine-radius-md)",
};

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function readProductError(json: ProductResponse): string | null {
  return json.error ?? json.errors?.[0]?.message ?? null;
}

export function ProductReferenceAssistant({
  mode,
  productId,
  onDraftChange,
}: ProductReferenceAssistantProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductReferenceValues>(
    DEFAULT_PRODUCT_REFERENCE_VALUES
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SampleQualityMetrics | null>(null);
  const [reason, setReason] = useState("Reference updated from assistant");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const rgb = useMemo(
    () => hexToRgb(values.rgb_approx) ?? DEFAULT_REFERENCE_RGB,
    [values.rgb_approx]
  );

  const setReferenceFromRgb = useCallback((nextRgb: RgbColor) => {
    setValues((current) => referenceValuesFromRgb(nextRgb, current));
  }, []);

  const handleColorChange = useCallback(
    (hex: string | null) => {
      const nextRgb = hexToRgb(hex);
      if (!nextRgb) {
        return;
      }
      setMetrics(null);
      setReferenceFromRgb(nextRgb);
      setSuccess(null);
      setError(null);
    },
    [setReferenceFromRgb]
  );

  const handleRgbChannelChange = useCallback(
    (channel: keyof RgbColor, value: string | number | null) => {
      const nextRgb = { ...rgb, [channel]: clampRgbChannel(value) };
      setMetrics(null);
      setReferenceFromRgb(nextRgb);
      setSuccess(null);
      setError(null);
    },
    [rgb, setReferenceFromRgb]
  );

  const handleLimitChange = useCallback(
    (
      field: "tol_l" | "tol_a" | "tol_b" | "delta_e_max" | "warning_margin",
      value: string | number | null
    ) => {
      setValues((current) => updateReferenceLimit(current, field, value));
      setSuccess(null);
      setError(null);
    },
    []
  );

  const handleFileChange = useCallback((file: File | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setMetrics(null);
    setSuccess(null);
    setError(null);

    if (!file) {
      setImageUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
  }, []);

  const handleImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const width = image.naturalWidth;
      const height = image.naturalHeight;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setError("Canvas context is unavailable in this browser.");
        return;
      }

      try {
        context.drawImage(image, 0, 0, width, height);
        const roi = getCenterRoi(width, height);
        const imageData = context.getImageData(roi.x, roi.y, roi.width, roi.height);
        const analysis = analyzeSamplePixels(imageData.data, { width: roi.width });
        setReferenceFromRgb(analysis.rgb);
        setMetrics(analysis.metrics);
        setError(null);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to read reference pixels."
        );
      }
    },
    [setReferenceFromRgb]
  );

  const handleApply = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "create") {
        onDraftChange?.(values);
        setSuccess("Reference values staged for the product form.");
        return;
      }

      if (!productId) {
        throw new Error("Product id is required.");
      }

      const response = await fetch(`/api/qc/products/${productId}/update-reference`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          reason: reason.trim() || "Reference updated from assistant",
        }),
      });
      const json = (await response.json().catch(() => ({}))) as ProductResponse;
      if (!response.ok) {
        throw new Error(readProductError(json) ?? "Failed to update reference.");
      }

      setSuccess("Reference values applied to product.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to apply reference.");
    } finally {
      setSaving(false);
    }
  }, [mode, onDraftChange, productId, reason, router, values]);

  useEffect(() => {
    if (mode !== "edit" || !productId) {
      return;
    }

    let active = true;

    async function loadProductReference() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/items/products/${productId}`, {
          cache: "no-store",
        });
        const json = (await response.json().catch(() => ({}))) as ProductResponse;
        if (!response.ok) {
          throw new Error(
            readProductError(json) ?? "Failed to load product reference."
          );
        }
        if (active) {
          setValues(mergeReferenceValues(json.data ?? {}));
        }
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load product reference."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProductReference();

    return () => {
      active = false;
    };
  }, [mode, productId]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    },
    []
  );

  return (
    <Paper
      withBorder
      p="lg"
      radius="md"
      style={surfaceStyle}
      data-testid="product-reference-assistant"
    >
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2}>Reference assistant</Title>
            <Text c="dimmed" size="sm">
              Photo sampling or RGB picking generates the L*a*b* reference.
            </Text>
          </Box>
          <Badge color="success" variant="outline">
            {mode === "create" ? "Draft" : "Versioned"}
          </Badge>
        </Group>

        {error ? (
          <Alert color="danger" variant="light">
            {error}
          </Alert>
        ) : null}
        {success ? (
          <Alert color="success" variant="light">
            {success}
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap="md">
            <Paper withBorder p="md" radius="md" style={surfaceStyle}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Box>
                    <Text fw={700}>Photo reference</Text>
                    <Text size="sm" c="dimmed">
                      Center ROI is sampled from the selected image.
                    </Text>
                  </Box>
                  {metrics ? (
                    <Badge color="success" variant="outline">
                      Sampled
                    </Badge>
                  ) : null}
                </Group>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  name="reference-photo"
                  aria-label="Upload reference photo"
                  onChange={(event) =>
                    handleFileChange(event.currentTarget.files?.[0] ?? null)
                  }
                  style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                />
                <Button color="cta" onClick={() => fileInputRef.current?.click()}>
                  Upload reference photo
                </Button>
                <Box style={previewStyle}>
                  {imageUrl ? (
                    <MantineImage
                      src={imageUrl}
                      alt="Reference photo preview"
                      fit="contain"
                      h={220}
                      onLoad={handleImageLoad}
                    />
                  ) : (
                    <Stack h={220} align="center" justify="center" gap="xs">
                      <ColorSwatch color={values.rgb_approx} size={42} />
                      <Text size="sm" c="dimmed">
                        No photo selected
                      </Text>
                    </Stack>
                  )}
                </Box>
                {metrics ? (
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                    <Paper p="xs" style={roiNoteStyle}>
                      <Text size="xs" c="dimmed">
                        Powder pixels
                      </Text>
                      <Text fw={700}>{metrics.powderPixels}</Text>
                    </Paper>
                    <Paper p="xs" style={roiNoteStyle}>
                      <Text size="xs" c="dimmed">
                        Brightness
                      </Text>
                      <Text fw={700}>{formatNumber(metrics.averageBrightness)}</Text>
                    </Paper>
                    <Paper p="xs" style={roiNoteStyle}>
                      <Text size="xs" c="dimmed">
                        Texture
                      </Text>
                      <Text fw={700}>{formatNumber(metrics.textureContrast)}</Text>
                    </Paper>
                  </SimpleGrid>
                ) : null}
              </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md" style={surfaceStyle}>
              <Stack gap="md">
                <Text fw={700}>Manual RGB</Text>
                <Color
                  label="Rgb Approx"
                  value={values.rgb_approx}
                  onChange={handleColorChange}
                  disabled={loading}
                />
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <Input
                    label="R"
                    type="integer"
                    min={0}
                    max={255}
                    value={rgb.r}
                    onChange={(value) => handleRgbChannelChange("r", value)}
                  />
                  <Input
                    label="G"
                    type="integer"
                    min={0}
                    max={255}
                    value={rgb.g}
                    onChange={(value) => handleRgbChannelChange("g", value)}
                  />
                  <Input
                    label="B"
                    type="integer"
                    min={0}
                    max={255}
                    value={rgb.b}
                    onChange={(value) => handleRgbChannelChange("b", value)}
                  />
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stack>

          <Stack gap="md">
            <Paper withBorder p="md" radius="md" style={surfaceStyle}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Box>
                    <Text fw={700}>Generated reference</Text>
                    <Text size="sm" c="dimmed">
                      Review generated LAB and tune limits before apply.
                    </Text>
                  </Box>
                  <ColorSwatch color={values.rgb_approx} size={38} />
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <Input label="Ref L" type="float" value={values.ref_l} readonly />
                  <Input label="Ref A" type="float" value={values.ref_a} readonly />
                  <Input label="Ref B" type="float" value={values.ref_b} readonly />
                  <Input
                    label="Tol L"
                    type="float"
                    min={0.01}
                    value={values.tol_l}
                    onChange={(value) => handleLimitChange("tol_l", value)}
                  />
                  <Input
                    label="Tol A"
                    type="float"
                    min={0.01}
                    value={values.tol_a}
                    onChange={(value) => handleLimitChange("tol_a", value)}
                  />
                  <Input
                    label="Tol B"
                    type="float"
                    min={0.01}
                    value={values.tol_b}
                    onChange={(value) => handleLimitChange("tol_b", value)}
                  />
                  <Input
                    label="Delta E Max"
                    type="float"
                    min={0.01}
                    value={values.delta_e_max}
                    onChange={(value) => handleLimitChange("delta_e_max", value)}
                  />
                  <Input
                    label="Warning Margin"
                    type="float"
                    min={0}
                    max={1}
                    step={0.01}
                    value={values.warning_margin}
                    onChange={(value) => handleLimitChange("warning_margin", value)}
                  />
                </SimpleGrid>
                {mode === "edit" ? (
                  <Textarea
                    label="Change reason"
                    value={reason}
                    onChange={(value) => setReason(value ?? "")}
                    minRows={2}
                    maxRows={4}
                    trim
                  />
                ) : null}
                <Group justify="flex-end">
                  <Button
                    color="cta"
                    onClick={handleApply}
                    loading={saving}
                    disabled={loading}
                  >
                    {mode === "create" ? "Apply to new product" : "Apply reference"}
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </SimpleGrid>
      </Stack>
      <canvas ref={canvasRef} hidden aria-hidden="true" />
    </Paper>
  );
}
