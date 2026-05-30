"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Code,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconMessageCircle,
  IconRobot,
  IconSend2,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useChat } from "@ai-sdk/react";

import { Textarea } from "@/components/ui/textarea";
import { MANAGER_AI_PROMPTS } from "@/lib/dashboard/manager-ai";
import type { QcLotAnalyticsRow } from "@/lib/dashboard/qc-analytics";

interface ManagerAiAssistantProps {
  rows: QcLotAnalyticsRow[];
}

const dockStyle: CSSProperties = {
  position: "fixed",
  top: "calc(var(--ds-spacing-6) + 72px)",
  right: "var(--ds-spacing-5)",
  zIndex: 260,
  pointerEvents: "none",
};

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: "calc(56px + var(--ds-spacing-3))",
  width: "min(400px, calc(100vw - 96px))",
  maxHeight: "calc(100vh - 128px)",
  display: "flex",
  flexDirection: "column",
  pointerEvents: "auto",
  background: "var(--ds-surface-white)",
  borderColor: "var(--ds-border-color)",
  boxShadow: "var(--mantine-shadow-lg)",
};

const aiButtonStyle: CSSProperties = {
  width: 56,
  height: 56,
  pointerEvents: "auto",
  background: "var(--ds-primary)",
  color: "var(--ds-surface-white)",
  boxShadow: "var(--mantine-shadow-md)",
};

function bubbleStyle(role: string): CSSProperties {
  const isUser = role === "user";
  return {
    background: isUser ? "var(--ds-primary)" : "var(--ds-primary-muted)",
    color: isUser ? "var(--ds-surface-white)" : "inherit",
    border: isUser ? "none" : "1px solid var(--ds-border-color)",
    borderRadius: "var(--mantine-radius-md)",
    padding: "var(--ds-spacing-3)",
    alignSelf: isUser ? "flex-end" : "flex-start",
    maxWidth: "90%",
  };
}

export function ManagerAiAssistant({ rows }: ManagerAiAssistantProps) {
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();

  const busy = status === "submitted" || status === "streaming";

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    void sendMessage({ text: trimmed });
    setInput("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }

  return (
    <Box style={dockStyle} data-testid="manager-ai-assistant">
      {opened ? (
        <Paper withBorder radius="md" p="md" style={panelStyle}>
          <Group justify="space-between" align="center" mb="sm">
            <Group gap="xs">
              <IconSparkles size={18} aria-hidden="true" />
              <Text fw={700}>Ask AI</Text>
            </Group>
            <Group gap="xs">
              <Badge color="primary" variant="outline">
                {rows.length} lots
              </Badge>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Close Ask AI"
                onClick={() => setOpened(false)}
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          </Group>

          <ScrollArea style={{ flex: 1 }} type="auto" mih={160} offsetScrollbars>
            <Stack gap="sm" py="xs">
              {messages.length === 0 ? (
                <Box
                  style={{
                    ...bubbleStyle("assistant"),
                    alignSelf: "stretch",
                    maxWidth: "100%",
                  }}
                >
                  <Group gap="xs" mb={4}>
                    <IconMessageCircle size={16} aria-hidden="true" />
                    <Text fw={700} size="sm">
                      Ask about your QC data
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Pass rate, ΔE trend, reject and warning lots — ask in your
                    own words or tap a prompt below.
                  </Text>
                </Box>
              ) : null}

              {messages.map((message) => (
                <Box key={message.id} style={bubbleStyle(message.role)}>
                  <Stack gap="xs">
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <Text
                            key={index}
                            size="sm"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {part.text}
                          </Text>
                        );
                      }
                      if (part.type.startsWith("tool-")) {
                        const toolPart = part as {
                          type: string;
                          state?: string;
                          output?: unknown;
                        };
                        return (
                          <Box key={index}>
                            <Text size="xs" c="dimmed" mb={4}>
                              {toolPart.type.replace("tool-", "")}
                              {toolPart.state ? ` — ${toolPart.state}` : ""}
                            </Text>
                            {toolPart.output !== undefined ? (
                              <Code
                                block
                                style={{ maxHeight: 160, overflow: "auto" }}
                              >
                                {JSON.stringify(toolPart.output, null, 2)}
                              </Code>
                            ) : null}
                          </Box>
                        );
                      }
                      return null;
                    })}
                  </Stack>
                </Box>
              ))}

              {status === "submitted" ? (
                <Group gap="xs" style={{ alignSelf: "flex-start" }}>
                  <Loader size="xs" />
                  <Text size="sm" c="dimmed">
                    Thinking…
                  </Text>
                </Group>
              ) : null}

              {status === "error" ? (
                <Text size="sm" c="red">
                  {error?.message ?? "Ask AI failed. Check Bedrock config."}
                </Text>
              ) : null}
            </Stack>
          </ScrollArea>

          <Group gap="xs" my="sm">
            {MANAGER_AI_PROMPTS.map((prompt) => (
              <Button
                key={prompt.id}
                size="xs"
                variant="light"
                color="cta"
                disabled={busy}
                onClick={() => ask(prompt.question)}
              >
                {prompt.label}
              </Button>
            ))}
          </Group>

          <form onSubmit={handleSubmit}>
            <Stack gap="xs">
              <Textarea
                label="Question"
                value={input}
                minRows={2}
                maxRows={4}
                disabled={busy}
                onChange={(value) => setInput(value ?? "")}
              />
              <Group justify="flex-end">
                <Button
                  type="submit"
                  color="cta"
                  leftSection={<IconSend2 size={16} />}
                  loading={busy}
                  disabled={!input.trim()}
                >
                  Ask
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      ) : null}

      <Tooltip label={opened ? "Close Ask AI" : "Open Ask AI"} position="left">
        <ActionIcon
          radius="xl"
          size={56}
          aria-label={opened ? "Close Ask AI" : "Open Ask AI"}
          aria-expanded={opened}
          onClick={() => setOpened((current) => !current)}
          style={aiButtonStyle}
        >
          <IconRobot size={28} />
        </ActionIcon>
      </Tooltip>
    </Box>
  );
}
