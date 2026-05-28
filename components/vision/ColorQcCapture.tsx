"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  ColorSwatch,
  FileButton,
  Group,
  Image as MantineImage,
  List,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

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

export interface ColorQcCaptureProps {
  products?: readonly ProductReference[];
}

interface RoiRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getRgbCss(rgb: RgbColor): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function formatLab(lab: LabColor): string {
  return `L ${lab.L.toFixed(2)}, a ${lab.a.toFixed(2)}, b ${lab.b.toFixed(2)}`;
}

function getCenterRoi(width: number, height: number): RoiRect {
  const roiWidth = Math.max(1, Math.floor(width * 0.5));
  const roiHeight = Math.max(1, Math.floor(height * 0.5));

  return {
    x: Math.floor((width - roiWidth) / 2),
    y: Math.floor((height - roiHeight) / 2),
    width: roiWidth,
    height: roiHeight,
  };
}

export function ColorQcCapture({
  products = REFERENCE_PRODUCTS,
}: ColorQcCaptureProps) {
  const firstProduct = products[0] ?? REFERENCE_PRODUCTS[0];
  const [selectedProductId, setSelectedProductId] = useState(firstProduct.id);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [measuredRgb, setMeasuredRgb] = useState<RgbColor | null>(null);
  const [measuredLab, setMeasuredLab] = useState<LabColor | null>(null);
  const [sampleAnalysis, setSampleAnalysis] =
    useState<SamplePixelAnalysis | null>(null);
  const [sessionReference, setSessionReference] = useState<LabColor | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const product = useMemo(
    () =>
      products.find((item) => item.id === selectedProductId) ?? firstProduct,
    [firstProduct, products, selectedProductId]
  );

  const productOptions = useMemo(
    () => products.map((item) => ({ value: item.id, label: item.name })),
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
        const imageData = context.getImageData(
          roi.x,
          roi.y,
          roi.width,
          roi.height
        );
        const analysis = analyzeSamplePixels(imageData.data);
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
          <Select
            label="Product reference"
            data={productOptions}
            value={selectedProductId}
            onChange={(value) => {
              if (value) {
                setSelectedProductId(value);
                setSessionReference(null);
              }
            }}
            allowDeselect={false}
          />
          <Group align="flex-end">
            <FileButton
              accept="image/*"
              name="sample-photo"
              inputProps={{ "aria-label": "Upload sample photo" }}
              onChange={handleFileChange}
            >
              {(props) => <Button {...props}>Upload sample photo</Button>}
            </FileButton>
          </Group>
        </SimpleGrid>

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

        <canvas ref={canvasRef} hidden aria-hidden="true" />
      </Stack>
    </Card>
  );
}
