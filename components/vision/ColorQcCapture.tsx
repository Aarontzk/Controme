"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  ColorSwatch,
  Group,
  Image as MantineImage,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { Textarea } from "@/components/ui/textarea";
import {
  evaluateSample,
  REFERENCE_PRODUCTS,
  type LabColor,
  type ProductReference,
  type RgbColor,
} from "@/lib/domain";
import {
  analyzeSamplePixels,
  rgbToLab,
  type SamplePixelAnalysis,
} from "@/lib/vision/sample-color";
import { getCenterRoi } from "@/lib/vision/roi";
import { CameraCapture } from "./CameraCapture";

export interface ColorQcCaptureProps {
  products?: readonly ProductReference[];
  /** When true, show "Save QC lot" — posts to /api/qc/lots for server-authoritative recompute + persistence. */
  persist?: boolean;
  /**
   * Pre-select a product instead of starting on the "Select…" placeholder.
   * The real capture flow leaves this unset so the operator must choose; the
   * vision PoC harness sets it for deterministic, selection-free assertions.
   */
  defaultProductId?: string;
}

interface SavedLotResult {
  lotId: string | null;
  status: "pass" | "reject";
  deltaE: number;
  failedLanes: string[];
  lightingWarnings: string[];
  warningFlag?: boolean;
}

interface SaveLotResponse {
  success?: boolean;
  error?: string;
  data?: { id?: string };
  result?: {
    status: "pass" | "reject";
    deltaE: number;
    failedLanes: string[];
    lightingWarnings: string[];
    warningFlag?: boolean;
  };
}

function getRgbCss(rgb: RgbColor): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function formatLab(lab: LabColor): string {
  return `L ${lab.L.toFixed(2)}, a ${lab.a.toFixed(2)}, b ${lab.b.toFixed(2)}`;
}

function statusColor(status: "pass" | "reject"): "success" | "danger" {
  return status === "pass" ? "success" : "danger";
}

function statusPanelStyle(status: "pass" | "reject"): CSSProperties {
  return {
    background:
      status === "pass" ? "var(--ds-status-pass-bg)" : "var(--ds-status-reject-bg)",
    borderColor:
      status === "pass"
        ? "var(--ds-status-pass-border)"
        : "var(--ds-status-reject-border)",
  };
}

const neutralPanelStyle: CSSProperties = {
  background: "var(--ds-surface-white)",
  borderColor: "var(--ds-border-color)",
};

export function ColorQcCapture({
  products = REFERENCE_PRODUCTS,
  persist = false,
  defaultProductId,
}: ColorQcCaptureProps) {
  const router = useRouter();
  // Start with no selection so the operator must consciously pick the product
  // and QC stage — both dropdowns show their "Select…" placeholder until then.
  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultProductId ?? ""
  );
  const [qcStage, setQcStage] = useState<"incoming" | "finish" | "">("");
  const [lotCode, setLotCode] = useState("");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [measuredRgb, setMeasuredRgb] = useState<RgbColor | null>(null);
  const [measuredLab, setMeasuredLab] = useState<LabColor | null>(null);
  const [sampleAnalysis, setSampleAnalysis] =
    useState<SamplePixelAnalysis | null>(null);
  const [sessionReference, setSessionReference] = useState<LabColor | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedLot, setSavedLot] = useState<SavedLotResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const product = useMemo(
    () => products.find((item) => item.id === selectedProductId),
    [products, selectedProductId]
  );

  const productOptions = useMemo(
    () => products.map((item) => ({ value: item.id, text: item.name })),
    [products]
  );

  const activeProduct = useMemo(() => {
    if (!product) return undefined;
    return sessionReference
      ? { ...product, reference: sessionReference }
      : product;
  }, [product, sessionReference]);

  const evaluation = useMemo(
    () =>
      measuredLab && activeProduct
        ? evaluateSample(activeProduct, measuredLab)
        : null,
    [activeProduct, measuredLab]
  );

  const finalStatus = useMemo(() => {
    if (!evaluation || !sampleAnalysis) {
      return null;
    }

    if (
      evaluation.status === "reject" ||
      sampleAnalysis.contamination.status === "reject" ||
      sampleAnalysis.consistency.status === "reject"
    ) {
      return "reject";
    }

    return "pass";
  }, [evaluation, sampleAnalysis]);

  const handleFileChange = useCallback((file: File | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setMeasuredRgb(null);
    setMeasuredLab(null);
    setSampleAnalysis(null);
    setError(null);
    setSelectedFile(file);
    setSavedLot(null);
    setSaveError(null);

    if (!file) {
      setImageUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
  }, []);

  // Clear the current photo + analysis so the viewfinder goes empty and a fresh
  // frame can be grabbed. The hidden file input is reset first — otherwise the
  // 250ms input poll would immediately re-apply the same uploaded file.
  const handleReset = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    handleFileChange(null);
  }, [handleFileChange]);

  const handleSaveLot = useCallback(async () => {
    if (!selectedFile) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSavedLot(null);
    try {
      const body = new FormData();
      body.append("photo", selectedFile);
      body.append("productId", selectedProductId);
      body.append("qcStage", qcStage);
      body.append("lotCode", lotCode.trim());
      body.append("note", note.trim());
      const response = await fetch("/api/qc/lots", { method: "POST", body });
      // Read as text first: an infra-level failure (Lambda crash, payload/timeout)
      // returns a plaintext body like "Internal Server Error", not JSON. Blindly
      // calling response.json() on that throws a misleading "Unexpected token" error
      // and hides the real status, so parse defensively and surface what we got.
      const raw = await response.text();
      let json: SaveLotResponse;
      try {
        json = raw ? (JSON.parse(raw) as SaveLotResponse) : {};
      } catch {
        throw new Error(
          `Server error ${response.status}: ${
            raw.trim().slice(0, 140) || response.statusText || "non-JSON response"
          }`
        );
      }
      if (!response.ok || !json.success || !json.result) {
        throw new Error(
          json.error ?? `Failed to save QC lot (HTTP ${response.status}).`
        );
      }
      setSavedLot({
        lotId: json.data?.id ?? null,
        status: json.result.status,
        deltaE: json.result.deltaE,
        failedLanes: json.result.failedLanes,
        lightingWarnings: json.result.lightingWarnings,
        warningFlag: json.result.warningFlag,
      });
    } catch (caught) {
      setSaveError(
        caught instanceof Error ? caught.message : "Failed to save QC lot."
      );
    } finally {
      setSaving(false);
    }
  }, [lotCode, note, qcStage, selectedFile, selectedProductId]);

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
        const imageData = context.getImageData(
          roi.x,
          roi.y,
          roi.width,
          roi.height
        );
        const analysis = analyzeSamplePixels(imageData.data, {
          width: roi.width,
        });
        const lab = rgbToLab(analysis.rgb);
        setMeasuredRgb(analysis.rgb);
        setMeasuredLab(lab);
        setSampleAnalysis(analysis);
        setError(null);
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to read sample pixels.";
        setError(message);
      }
    },
    []
  );

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const file = fileInputRef.current?.files?.[0] ?? null;
      if (file && file !== selectedFile) {
        handleFileChange(file);
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [handleFileChange, selectedFile]);

  const refLab = activeProduct?.reference;
  const deltas =
    measuredLab && refLab
      ? {
          L: measuredLab.L - refLab.L,
          a: measuredLab.a - refLab.a,
          b: measuredLab.b - refLab.b,
        }
      : null;

  const cielabTiles: ReadonlyArray<{
    key: "L" | "a" | "b";
    label: string;
    value: number | undefined;
    delta: number | undefined;
  }> = [
    { key: "L", label: "L* (Lightness)", value: measuredLab?.L, delta: deltas?.L },
    { key: "a", label: "a* (Red/Green)", value: measuredLab?.a, delta: deltas?.a },
    { key: "b", label: "b* (Yellow/Blue)", value: measuredLab?.b, delta: deltas?.b },
  ];

  const diagnosisText = (() => {
    if (measuredLab && !product) {
      return "Select a product reference to evaluate this sample.";
    }
    if (!evaluation) return "System diagnosis will appear here after analysis.";
    if (finalStatus === "reject") {
      const reason =
        evaluation.channelFlags.length > 0
          ? evaluation.channelFlags
              .map((flag) => `${flag.channel} ${flag.direction}`)
              .join(", ")
          : "contamination / consistency lane";
      return `REJECT — out of spec on ${reason}.`;
    }
    if (evaluation.warningFlag) {
      return "PASS — within tolerance, but ΔE is in the warning band. Monitor this lot.";
    }
    return "PASS — sample is within colour, contamination, and consistency tolerances.";
  })();

  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: "stretch" }}>
      {/* 1. Sample Capture */}
      <Card withBorder radius="md" p="lg" style={neutralPanelStyle}>
        <Stack gap="md">
          <Box>
            <Title order={3} style={{ color: "var(--ds-primary)" }}>
              1. Sample Capture
            </Title>
            <Text c="dimmed" size="sm">
              Pick the product, tag the lot, then capture the powder sample.
            </Text>
          </Box>

          <SelectDropdown
            label="Product Reference"
            placeholder="Select product…"
            choices={productOptions}
            value={selectedProductId || null}
            onChange={(value) => {
              if (typeof value === "string") {
                setSelectedProductId(value);
                setSessionReference(null);
              }
            }}
            allowNone={false}
          />

          <SelectDropdown
            label="QC Stage"
            placeholder="Select stage…"
            choices={[
              { value: "incoming", text: "Incoming" },
              { value: "finish", text: "Finish" },
            ]}
            value={qcStage || null}
            onChange={(value) => {
              if (value === "incoming" || value === "finish") {
                setQcStage(value);
              }
            }}
            allowNone={false}
          />

          <Input
            label="Lot Number (optional)"
            placeholder="Leave blank → auto per product, e.g. GIN-0001"
            value={lotCode}
            onChange={(value) => setLotCode(String(value ?? ""))}
            trim
          />

          <Box>
            <Text fw={600} size="sm" mb="var(--ds-spacing-1)">
              Camera Viewfinder
            </Text>
            <Box
              style={{
                position: "relative",
                borderRadius: "var(--ds-radius-md, 12px)",
                overflow: "hidden",
                background: "#23211c",
                minHeight: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {imageUrl ? (
                <MantineImage
                  src={imageUrl}
                  alt="Uploaded QC sample"
                  fit="contain"
                  mah={320}
                  onLoad={handleImageLoad}
                  data-testid="qc-preview"
                />
              ) : (
                <Stack align="center" gap="var(--ds-spacing-4)" py="var(--ds-spacing-8)">
                  <Box
                    style={{
                      width: 120,
                      height: 120,
                      border: "2px dashed rgba(255,255,255,0.5)",
                      borderRadius: "var(--ds-radius-sm, 4px)",
                    }}
                  />
                  <Text size="sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Align sample within the target box
                  </Text>
                </Stack>
              )}
            </Box>
          </Box>

          <CameraCapture onCapture={handleFileChange} />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            name="sample-photo"
            aria-label="Upload sample photo"
            onChange={(event) =>
              handleFileChange(event.currentTarget.files?.[0] ?? null)
            }
            onInput={(event) =>
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
          <Group grow gap="sm">
            <Button color="cta" onClick={() => fileInputRef.current?.click()}>
              {imageUrl ? "Replace photo" : "Take / Upload Photo"}
            </Button>
            {imageUrl ? (
              <Button
                variant="light"
                color="gray"
                leftSection={<IconRefresh size={16} />}
                onClick={handleReset}
                data-testid="reset-photo"
              >
                Reset photo
              </Button>
            ) : null}
          </Group>

          {error ? (
            <Alert color="danger" variant="light">
              {error}
            </Alert>
          ) : null}
        </Stack>
      </Card>

      {/* 2. Analysis Results */}
      <Card withBorder radius="md" p="lg" style={neutralPanelStyle}>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3} style={{ color: "var(--ds-primary)" }}>
              2. Analysis Results
            </Title>
            {finalStatus ? (
              <Badge
                color={statusColor(finalStatus)}
                size="lg"
                variant="outline"
                data-testid="qc-status"
              >
                {finalStatus}
              </Badge>
            ) : (
              <Badge color="gray" size="lg" variant="outline">
                PENDING
              </Badge>
            )}
          </Group>

          <Paper
            withBorder
            p="lg"
            radius="md"
            style={evaluation ? statusPanelStyle(evaluation.status) : neutralPanelStyle}
          >
            <Stack gap="var(--ds-spacing-2)" align="center">
              <Text size="sm" c="dimmed">
                Total Color Difference ({"ΔE"})
              </Text>
              <Text
                fw={700}
                data-testid="qc-delta-e"
                style={{ fontSize: "2.25rem", lineHeight: 1.1 }}
              >
                {evaluation ? evaluation.deltaE.toFixed(2) : "—"}
              </Text>
              <Group gap="xs" justify="center">
                {evaluation ? (
                  <Badge
                    color={statusColor(evaluation.status)}
                    variant="outline"
                    data-testid="color-status"
                  >
                    {evaluation.status}
                  </Badge>
                ) : null}
                {evaluation?.warningFlag ? (
                  <Badge color="warning" variant="outline" data-testid="warning-flag">
                    warning band
                  </Badge>
                ) : null}
              </Group>
              <Group gap="xs" justify="center">
                <ColorSwatch
                  color={
                    product?.rgbApprox
                      ? getRgbCss(product.rgbApprox)
                      : "var(--ds-border-color)"
                  }
                  size={28}
                  data-testid="reference-swatch"
                />
                <Text size="xs" c="dimmed">
                  reference
                </Text>
                <ColorSwatch
                  color={measuredRgb ? getRgbCss(measuredRgb) : "var(--ds-gray-300)"}
                  size={28}
                  data-testid="measured-swatch"
                />
                <Text size="xs" c="dimmed">
                  {measuredLab
                    ? formatLab(measuredLab)
                    : "awaiting capture to calculate difference"}
                </Text>
              </Group>
              {sessionReference ? (
                <Badge color="primary" variant="outline">
                  session calibrated
                </Badge>
              ) : null}
            </Stack>
          </Paper>

          <Box>
            <Text fw={600} size="sm" mb="var(--ds-spacing-2)">
              CIELAB Values
            </Text>
            <SimpleGrid cols={3} spacing="xs">
              {cielabTiles.map((tile) => (
                <Paper
                  key={tile.key}
                  withBorder
                  p="xs"
                  radius="md"
                  style={neutralPanelStyle}
                >
                  <Stack gap={2} align="center">
                    <Text size="xs" c="dimmed" ta="center">
                      {tile.label}
                    </Text>
                    <Text fw={700}>
                      {typeof tile.value === "number" ? tile.value.toFixed(1) : "—"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {"Δ"}{" "}
                      {typeof tile.delta === "number"
                        ? `${tile.delta >= 0 ? "+" : ""}${tile.delta.toFixed(1)}`
                        : "—"}
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Box>

          <Paper
            withBorder
            p="md"
            radius="md"
            style={evaluation ? statusPanelStyle(finalStatus ?? "pass") : neutralPanelStyle}
          >
            <Text size="sm">{diagnosisText}</Text>
            {evaluation && measuredLab ? (
              <Group gap="xs" mt="var(--ds-spacing-2)">
                <Button
                  size="xs"
                  variant="light"
                  color="primary"
                  onClick={() => setSessionReference(measuredLab)}
                >
                  Use as session reference
                </Button>
                {sessionReference ? (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="primary"
                    onClick={() => setSessionReference(null)}
                  >
                    Reset reference
                  </Button>
                ) : null}
              </Group>
            ) : null}
          </Paper>

          <Paper
            withBorder
            p="md"
            radius="md"
            style={
              sampleAnalysis
                ? statusPanelStyle(
                    sampleAnalysis.contamination.status === "reject" ||
                      sampleAnalysis.consistency.status === "reject"
                      ? "reject"
                      : "pass"
                  )
                : neutralPanelStyle
            }
          >
            <Stack gap="xs">
              <Text fw={600} size="sm">
                Powder &amp; contamination
              </Text>
              {sampleAnalysis ? (
                <>
                  <Group gap="xs">
                    <Text size="sm">Contamination lane</Text>
                    <Badge
                      color={statusColor(sampleAnalysis.contamination.status)}
                      variant="outline"
                      data-testid="contamination-status"
                    >
                      {sampleAnalysis.contamination.status}
                    </Badge>
                    <Text size="sm">Consistency lane</Text>
                    <Badge
                      color={statusColor(sampleAnalysis.consistency.status)}
                      variant="outline"
                      data-testid="consistency-status"
                    >
                      {sampleAnalysis.consistency.status}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed" data-testid="powder-pixel-count">
                    Powder pixels: {sampleAnalysis.metrics.powderPixels} /{" "}
                    {sampleAnalysis.metrics.totalOpaquePixels}
                  </Text>
                  <Text size="xs" c="dimmed" data-testid="contaminant-ratio">
                    Contaminant ratio:{" "}
                    {(sampleAnalysis.metrics.contaminantRatio * 100).toFixed(2)}%
                  </Text>
                  <Text size="xs" c="dimmed" data-testid="texture-stddev">
                    Texture brightness std dev:{" "}
                    {sampleAnalysis.metrics.brightnessStdDev.toFixed(2)}
                  </Text>
                  <Text size="xs" c="dimmed" data-testid="texture-contrast">
                    Texture local contrast:{" "}
                    {sampleAnalysis.metrics.textureContrast.toFixed(2)}
                  </Text>
                  {sampleAnalysis.metrics.lightingWarnings.length > 0 ? (
                    <List size="xs" spacing="xs">
                      {sampleAnalysis.metrics.lightingWarnings.map((warning) => (
                        <List.Item key={warning}>{warning}</List.Item>
                      ))}
                    </List>
                  ) : null}
                </>
              ) : (
                <Text c="dimmed" size="sm">
                  Powder mask and contamination checks appear after image load.
                </Text>
              )}
            </Stack>
          </Paper>

          <Textarea
            label="Notes (Optional)"
            placeholder="Enter any visual contamination or texture notes here..."
            value={note}
            onChange={(value) => setNote(value ?? "")}
            minRows={2}
            maxRows={4}
            trim
          />

          {persist ? (
            <Stack gap="sm">
              <Button
                onClick={handleSaveLot}
                loading={saving}
                disabled={
                  !selectedFile || !measuredLab || !selectedProductId || !qcStage
                }
                data-testid="save-lot"
                color="cta"
                fullWidth
              >
                Save Record &amp; Next Lot
              </Button>
              {saveError ? (
                <Alert color="danger" variant="light" data-testid="save-error">
                  {saveError}
                </Alert>
              ) : null}
              {savedLot ? (
                <Alert
                  color={statusColor(savedLot.status)}
                  variant="light"
                  data-testid="saved-lot"
                >
                  <Stack gap="var(--ds-spacing-1)">
                    <Group gap="xs">
                      <Text fw={600}>Saved {"—"} server verdict:</Text>
                      <Badge
                        color={statusColor(savedLot.status)}
                        variant="outline"
                        data-testid="saved-status"
                      >
                        {savedLot.status}
                      </Badge>
                      {savedLot.warningFlag ? (
                        <Badge color="warning" variant="outline">
                          warning
                        </Badge>
                      ) : null}
                      <Text size="sm">
                        {"ΔE"} {savedLot.deltaE.toFixed(2)}
                      </Text>
                    </Group>
                    {savedLot.lotId ? (
                      <Group gap="xs" align="center">
                        <Text size="xs" c="dimmed">
                          Lot {savedLot.lotId}
                        </Text>
                        <Button
                          size="xs"
                          variant="light"
                          color="primary"
                          data-testid="view-saved-lot"
                          onClick={() => router.push(`/qc/lots/${savedLot.lotId}`)}
                        >
                          View lot
                        </Button>
                      </Group>
                    ) : null}
                    {savedLot.failedLanes.length > 0 ? (
                      <Text size="sm">
                        Failed lanes: {savedLot.failedLanes.join(", ")}
                      </Text>
                    ) : null}
                    {savedLot.lightingWarnings.map((warning) => (
                      <Text key={warning} size="xs" c="dimmed">
                        {warning}
                      </Text>
                    ))}
                  </Stack>
                </Alert>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </Card>

      <canvas ref={canvasRef} hidden aria-hidden="true" />
    </SimpleGrid>
  );
}
