"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Group, Paper, Stack, Text } from "@mantine/core";

export function CameraCapture({
  onCapture,
}: {
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not available in this browser.");
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start camera.");
    }
  }, []);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera frame is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Canvas context is unavailable in this browser.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) {
      setError("Unable to capture camera frame.");
      return;
    }

    onCapture(
      new File([blob], `qc-camera-${new Date().toISOString()}.jpg`, {
        type: "image/jpeg",
      })
    );
  }, [onCapture]);

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Box>
            <Text fw={600}>Camera capture</Text>
            <Text size="xs" c="dimmed">
              Align powder inside the center ROI guide before grabbing a frame.
            </Text>
          </Box>
          <Group gap="xs">
            {active ? (
              <Button variant="light" color="gray" onClick={stopCamera}>
                Stop
              </Button>
            ) : (
              <Button variant="light" onClick={startCamera}>
                Start camera
              </Button>
            )}
            <Button onClick={captureFrame} disabled={!active}>
              Grab frame
            </Button>
          </Group>
        </Group>
        {error ? (
          <Alert color="yellow" variant="light">
            {error}
          </Alert>
        ) : null}
        <Box pos="relative" style={{ overflow: "hidden", borderRadius: 8 }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              display: "block",
              width: "100%",
              minHeight: 220,
              background: "var(--mantine-color-gray-1)",
            }}
          />
          <Box
            aria-hidden="true"
            pos="absolute"
            left="25%"
            top="25%"
            w="50%"
            h="50%"
            style={{
              border: "2px solid var(--mantine-color-green-5)",
              boxShadow: "0 0 0 999px rgba(0, 0, 0, 0.18)",
              pointerEvents: "none",
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
