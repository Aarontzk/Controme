"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
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

import { Textarea } from "@/components/ui/textarea";
import {
  buildManagerAiAnswer,
  MANAGER_AI_PROMPTS,
  type ManagerAiAnswer,
} from "@/lib/dashboard/manager-ai";
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
  width: "min(380px, calc(100vw - 96px))",
  maxHeight: "calc(100vh - 128px)",
  overflowY: "auto",
  pointerEvents: "auto",
  background: "var(--ds-surface-white)",
  borderColor: "var(--ds-border-color)",
  boxShadow: "var(--mantine-shadow-lg)",
};

const answerStyle: CSSProperties = {
  background: "var(--ds-primary-muted)",
  border: "1px solid var(--ds-border-color)",
  borderRadius: "var(--mantine-radius-md)",
  padding: "var(--ds-spacing-3)",
};

const aiButtonStyle: CSSProperties = {
  width: 56,
  height: 56,
  pointerEvents: "auto",
  background: "var(--ds-primary)",
  color: "var(--ds-surface-white)",
  boxShadow: "var(--mantine-shadow-md)",
};

function answerColor(tone: ManagerAiAnswer["tone"]): string {
  if (tone === "pass") return "success";
  if (tone === "reject") return "danger";
  if (tone === "warning") return "warning";
  return "primary";
}

export function ManagerAiAssistant({ rows }: ManagerAiAssistantProps) {
  const [opened, setOpened] = useState(false);
  const [question, setQuestion] = useState(MANAGER_AI_PROMPTS[0].question);
  const [submittedQuestion, setSubmittedQuestion] = useState(
    MANAGER_AI_PROMPTS[0].question
  );

  const answer = useMemo(
    () => buildManagerAiAnswer(rows, submittedQuestion),
    [rows, submittedQuestion]
  );

  return (
    <Box style={dockStyle} data-testid="manager-ai-assistant">
      {opened ? (
        <Paper withBorder radius="md" p="md" style={panelStyle}>
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <IconSparkles size={18} aria-hidden="true" />
                <Text fw={700}>Ask AI</Text>
              </Group>
              <Group gap="xs">
                <Badge color={answerColor(answer.tone)} variant="outline">
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

            <Box style={answerStyle}>
              <Stack gap="xs">
                <Group gap="xs">
                  <IconMessageCircle size={16} aria-hidden="true" />
                  <Text fw={700}>{answer.title}</Text>
                </Group>
                <Text size="sm">{answer.body}</Text>
                <Stack gap={4}>
                  {answer.bullets.map((bullet) => (
                    <Text key={bullet} size="sm" c="dimmed">
                      {bullet}
                    </Text>
                  ))}
                </Stack>
              </Stack>
            </Box>

            <Group gap="xs">
              {MANAGER_AI_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.id}
                  size="xs"
                  variant={submittedQuestion === prompt.question ? "filled" : "light"}
                  color={submittedQuestion === prompt.question ? "primary" : "cta"}
                  onClick={() => {
                    setQuestion(prompt.question);
                    setSubmittedQuestion(prompt.question);
                  }}
                >
                  {prompt.label}
                </Button>
              ))}
            </Group>

            <Textarea
              label="Question"
              value={question}
              minRows={2}
              maxRows={4}
              onChange={(value) => setQuestion(value ?? "")}
            />
            <Group justify="flex-end">
              <Button
                color="cta"
                leftSection={<IconSend2 size={16} />}
                onClick={() =>
                  setSubmittedQuestion(question.trim() || MANAGER_AI_PROMPTS[0].question)
                }
              >
                Ask
              </Button>
            </Group>
          </Stack>
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
