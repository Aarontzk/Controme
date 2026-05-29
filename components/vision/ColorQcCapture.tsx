"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
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
}

interface SavedLotResult {
  lotId: string | null;
  status: "pass" | "reject";
  deltaE: number;
  failedLanes: string[];
  lightingWarnings: string[];
  warningFlag?: boolean;
}

function getRgbCss(rgb: RgbColor): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function formatLab(lab: LabColor): string {
  return `L ${lab.L.toFixed(2)}, a ${lab.a.toFixed(2)}, b ${lab.b.toFixed(2)}`;
}

export function ColorQcCapture({
  products = REFERENCE_PRODUCTS,
  persist = false,
}: ColorQcCaptureProps) {
  const router = useRouter();
  const firstProduct = products[0] ?? REFERENCE_PRODUCTS[0];
  const [selectedProductId, setSelectedProductId] = useState(firstProduct.id);
  const [qcStage, setQcStage] = useState<"incoming" | "finish">("incoming");
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
    () =>
      products.find((item) => item.id === selectedProductId) ?? firstProduct,
    [firstProduct, products, selectedProductId]
  );

  const productOptions = useMemo(
    () => products.map((item) => ({ value: item.id, text: item.name })),
    [products]
  );

  const activeProduct = useMemo(
    () =>
      sessionReference
        ? {
            ...product,
            reference: sessionReference,
          }
        : product,
    [product, sessionReference]
  );

  const evaluation = useMemo(
    () => (measuredLab ? evaluateSample(activeProduct, measuredLab) : null),
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
      const json = (await response.json()) as {
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
      };
      if (!response.ok || !json.success || !json.result) {
        throw new Error(json.error ?? "Failed to save QC lot.");
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

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={3}>Color {"\u0394E"} QC Capture</Title>
            <Text c="dimmed" size="sm">
              Center ROI color, texture, and contamination checks.
            </Text>
          </Box>
          {finalStatus ? (
            <Badge
              color={finalStatus === "pass" ? "green" : "red"}
              size="lg"
              data-testid="qc-status"
            >
              {finalStatus}
            </Badge>
          ) : null}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <SelectDropdown
            label="Product reference"
            choices={productOptions}
            value={selectedProductId}
            onChange={(value) => {
              if (typeof value === "string") {
                setSelectedProductId(value);
                setSessionReference(null);
              }
            }}
            allowNone={false}
          />
          <SelectDropdown
            label="QC stage"
            choices={[
              { value: "incoming", text: "Incoming" },
              { value: "finish", text: "Finish" },
            ]}
            value={qcStage}
            onChange={(value) => {
              if (value === "incoming" || value === "finish") {
                setQcStage(value);
              }
            }}
            allowNone={false}
          />
          <Input
            label="Lot code"
            placeholder="LOT-DF-001"
            value={lotCode}
            onChange={(value) => setLotCode(String(value ?? ""))}
            trim
          />
          <Textarea
            label="Operator note"
            placeholder="Optional visual observation"
            value={note}
            onChange={(value) => setNote(value ?? "")}
            minRows={2}
            maxRows={4}
            trim
          />
          <Group align="flex-end">
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
            <Button onClick={() => fileInputRef.current?.click()}>
              Upload sample photo
            </Button>
          </Group>
        </SimpleGrid>

        <CameraCapture onCapture={handleFileChange} />

        {error ? (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper withBorder p="md" radius="md">
            {imageUrl ? (
              <MantineImage
                src={imageUrl}
                alt="Uploaded QC sample"
                fit="contain"
                mah={360}
                onLoad={handleImageLoad}
                data-testid="qc-preview"
              />
            ) : (
              <Text c="dimmed" size="sm">
                Upload a sample image to measure the center ROI.
              </Text>
            )}
          </Paper>

          <Stack gap="md">
            <Paper withBorder p="md" radius="md">
              <Stack gap="sm">
                <Text fw={600}>Reference vs measured</Text>
                <Group>
                  <ColorSwatch
                    color={
                      product.rgbApprox
                        ? getRgbCss(product.rgbApprox)
                        : "var(--mantine-color-gray-4)"
                    }
                    size={42}
                    data-testid="reference-swatch"
                  />
                  <Text size="sm">{product.name}</Text>
                  {sessionReference ? (
                    <Badge color="blue" variant="light">
                      session calibrated
                    </Badge>
                  ) : null}
                </Group>
                <Group>
                  <ColorSwatch
                    color={
                      measuredRgb
                        ? getRgbCss(measuredRgb)
                        : "var(--mantine-color-gray-3)"
                    }
                    size={42}
                    data-testid="measured-swatch"
                  />
                  <Text size="sm">
                    {measuredRgb
                      ? `Measured ${getRgbCss(measuredRgb)}`
                      : "No sample measured"}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Stack gap="xs">
                <Text fw={600}>Color result</Text>
                {evaluation && measuredLab ? (
                  <>
                    <Group gap="xs">
                      <Text size="sm">Color lane</Text>
                      <Badge
                        color={evaluation.status === "pass" ? "green" : "red"}
                        data-testid="color-status"
                      >
                        {evaluation.status}
                      </Badge>
                    </Group>
                    <Text data-testid="qc-delta-e">
                      {"\u0394E"} {evaluation.deltaE.toFixed(2)}
                    </Text>
                    {evaluation.warningFlag ? (
                      <Badge color="yellow" variant="light" data-testid="warning-flag">
                        warning band
                      </Badge>
                    ) : null}
                    <Text size="sm" c="dimmed">
                      {formatLab(measuredLab)}
                    </Text>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => setSessionReference(measuredLab)}
                      >
                        Use as session reference
                      </Button>
                      {sessionReference ? (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => setSessionReference(null)}
                        >
                          Reset reference
                        </Button>
                      ) : null}
                    </Group>
                    {evaluation.channelFlags.length > 0 ? (
                      <List size="sm" spacing={4}>
                        {evaluation.channelFlags.map((flag) => (
                          <List.Item key={flag.channel}>
                            {flag.channel} {flag.direction}:{" "}
                            {flag.value.toFixed(2)} vs{" "}
                            {flag.reference.toFixed(2)} {"\u00b1"}{" "}
                            {flag.tolerance}
                          </List.Item>
                        ))}
                      </List>
                    ) : (
                      <Text size="sm">No channel flags.</Text>
                    )}
                  </>
                ) : (
                  <Text c="dimmed" size="sm">
                    Delta E and verdict appear after image load.
                  </Text>
                )}
              </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Stack gap="xs">
                <Text fw={600}>Powder and contamination checks</Text>
                {sampleAnalysis ? (
                  <>
                    <Group gap="xs">
                      <Text size="sm">Contamination lane</Text>
                      <Badge
                        color={
                          sampleAnalysis.contamination.status === "pass"
                            ? "green"
                            : "red"
                        }
                        data-testid="contamination-status"
                      >
                        {sampleAnalysis.contamination.status}
                      </Badge>
                    </Group>
                    <Text size="sm" data-testid="powder-pixel-count">
                      Powder pixels: {sampleAnalysis.metrics.powderPixels} /{" "}
                      {sampleAnalysis.metrics.totalOpaquePixels}
                    </Text>
                    <Text size="sm" data-testid="contaminant-ratio">
                      Contaminant ratio:{" "}
                      {(sampleAnalysis.metrics.contaminantRatio * 100).toFixed(
                        2
                      )}
                      %
                    </Text>
                    <Text size="sm">
                      Background/tray pixels excluded:{" "}
                      {sampleAnalysis.metrics.backgroundPixels}
                    </Text>
                    <Group gap="xs">
                      <Text size="sm">Consistency lane</Text>
                      <Badge
                        color={
                          sampleAnalysis.consistency.status === "pass"
                            ? "green"
                            : "red"
                        }
                        data-testid="consistency-status"
                      >
                        {sampleAnalysis.consistency.status}
                      </Badge>
                    </Group>
                    <Text size="sm" data-testid="texture-stddev">
                      Texture brightness std dev:{" "}
                      {sampleAnalysis.metrics.brightnessStdDev.toFixed(2)}
                    </Text>
                    <Text size="sm" data-testid="texture-contrast">
                      Texture local contrast:{" "}
                      {sampleAnalysis.metrics.textureContrast.toFixed(2)}
                    </Text>
                    {sampleAnalysis.metrics.lightingWarnings.length > 0 ? (
                      <List size="sm" spacing={4}>
                        {sampleAnalysis.metrics.lightingWarnings.map(
                          (warning) => (
                            <List.Item key={warning}>{warning}</List.Item>
                          )
                        )}
                      </List>
                    ) : (
                      <Text size="sm">Lighting guard: no warning.</Text>
                    )}
                  </>
                ) : (
                  <Text c="dimmed" size="sm">
                    Powder mask and contamination checks appear after image load.
                  </Text>
                )}
              </Stack>
            </Paper>
          </Stack>
        </SimpleGrid>

        {persist ? (
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Box>
                  <Text fw={600}>Save QC lot</Text>
                  <Text size="xs" c="dimmed">
                    {"ΔE"} and the verdict are recomputed from the photo on
                    the server, then stored as an immutable lot.
                  </Text>
                </Box>
                <Button
                  onClick={handleSaveLot}
                  loading={saving}
                  disabled={!selectedFile || !measuredLab}
                  data-testid="save-lot"
                >
                  Save QC lot
                </Button>
              </Group>
              {saveError ? (
                <Alert color="red" variant="light" data-testid="save-error">
                  {saveError}
                </Alert>
              ) : null}
              {savedLot ? (
                <Alert
                  color={savedLot.status === "pass" ? "green" : "red"}
                  variant="light"
                  data-testid="saved-lot"
                >
                  <Stack gap={4}>
                    <Group gap="xs">
                      <Text fw={600}>Saved — server verdict:</Text>
                      <Badge
                        color={savedLot.status === "pass" ? "green" : "red"}
                        data-testid="saved-status"
                      >
                        {savedLot.status}
                      </Badge>
                      {savedLot.warningFlag ? (
                        <Badge color="yellow" variant="light">
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
                          data-testid="view-saved-lot"
                          onClick={() =>
                            router.push(`/qc/lots/${savedLot.lotId}`)
                          }
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
          </Paper>
        ) : null}

        <canvas ref={canvasRef} hidden aria-hidden="true" />
      </Stack>
    </Card>
  );
}
