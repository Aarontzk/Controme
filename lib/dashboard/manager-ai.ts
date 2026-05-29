import {
  aggregatePassRates,
  buildDeltaTrend,
  getRejectedOrWarning,
  summarizeClearance,
  type QcLotAnalyticsRow,
} from "./qc-analytics";

export interface ManagerAiPrompt {
  id: "summary" | "risk" | "pass-rate" | "trend";
  label: string;
  question: string;
}

export interface ManagerAiAnswer {
  title: string;
  body: string;
  bullets: string[];
  tone: "neutral" | "warning" | "reject" | "pass";
}

export const MANAGER_AI_PROMPTS: ManagerAiPrompt[] = [
  {
    id: "summary",
    label: "Shift summary",
    question: "Summarize current QC performance",
  },
  {
    id: "risk",
    label: "Risk lots",
    question: "Which lots need manager attention?",
  },
  {
    id: "pass-rate",
    label: "Pass rate",
    question: "Which product has the weakest pass rate?",
  },
  {
    id: "trend",
    label: "Delta trend",
    question: "What is happening to Delta E trend?",
  },
];

function lotLabel(row: QcLotAnalyticsRow): string {
  return row.lot_code || row.id;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function highestDelta(rows: QcLotAnalyticsRow[]): QcLotAnalyticsRow | undefined {
  return rows
    .filter((row) => typeof row.delta_e === "number")
    .sort((a, b) => Number(b.delta_e) - Number(a.delta_e))[0];
}

function weakestPassRate(rows: QcLotAnalyticsRow[]) {
  return aggregatePassRates(rows).sort((a, b) => a.passRate - b.passRate)[0];
}

function questionIntent(question: string): ManagerAiPrompt["id"] {
  const text = question.toLowerCase();
  if (
    text.includes("risk") ||
    text.includes("attention") ||
    text.includes("reject") ||
    text.includes("warning") ||
    text.includes("action")
  ) {
    return "risk";
  }
  if (text.includes("pass") || text.includes("weak") || text.includes("product")) {
    return "pass-rate";
  }
  if (text.includes("trend") || text.includes("delta")) {
    return "trend";
  }
  return "summary";
}

export function buildManagerAiAnswer(
  rows: QcLotAnalyticsRow[],
  question: string
): ManagerAiAnswer {
  if (rows.length === 0) {
    return {
      title: "No QC lots yet",
      body: "There is not enough dashboard data to produce a manager insight.",
      bullets: ["Run QC capture first, then refresh this dashboard."],
      tone: "neutral",
    };
  }

  const intent = questionIntent(question);
  const summary = summarizeClearance(rows);
  const warnings = rows.filter((row) => row.warning_flag).length;
  const flagged = getRejectedOrWarning(rows);
  const weakest = weakestPassRate(rows);
  const highest = highestDelta(rows);

  if (intent === "risk") {
    if (flagged.length === 0) {
      return {
        title: "No active risk lots",
        body: "Current lots have no reject or warning flags in the manager view.",
        bullets: [
          `${summary.cleared} cleared lots out of ${rows.length}.`,
          highest
            ? `Highest Delta E is ${Number(highest.delta_e).toFixed(2)} on ${lotLabel(highest)}.`
            : "No Delta E values are available yet.",
        ],
        tone: "pass",
      };
    }

    return {
      title: "Manager attention needed",
      body: `${flagged.length} lot${flagged.length === 1 ? "" : "s"} are reject or warning flagged.`,
      bullets: flagged.slice(0, 3).map((row) => {
        const status = row.status === "reject" ? "reject" : "warning";
        const reason = row.reject_reason ? `, ${row.reject_reason}` : "";
        return `${lotLabel(row)}: ${status}${reason}.`;
      }),
      tone: flagged.some((row) => row.status === "reject") ? "reject" : "warning",
    };
  }

  if (intent === "pass-rate") {
    if (!weakest) {
      return {
        title: "Pass rate unavailable",
        body: "No product-level pass rate can be calculated yet.",
        bullets: ["Wait for at least one persisted QC lot."],
        tone: "neutral",
      };
    }

    return {
      title: "Weakest product pass rate",
      body: `${weakest.productName} is currently at ${formatPercent(weakest.passRate)} pass rate.`,
      bullets: [
        `${weakest.pass} pass / ${weakest.reject} reject / ${weakest.total} total.`,
        weakest.passRate < 0.8
          ? "Review recent lot photos and reference tolerance before release."
          : "Pass rate is above the manager watch threshold.",
      ],
      tone: weakest.passRate < 0.8 ? "warning" : "pass",
    };
  }

  if (intent === "trend") {
    const trend = buildDeltaTrend(rows, 8);
    const recent = trend.slice(-3).map((point) => point.deltaE);
    const previous = trend.slice(-6, -3).map((point) => point.deltaE);
    const recentAverage = average(recent);
    const previousAverage = average(previous);
    const movement =
      previous.length === 0
        ? "not enough earlier data for comparison"
        : recentAverage > previousAverage
          ? "moving up"
          : recentAverage < previousAverage
            ? "moving down"
            : "flat";

    return {
      title: "Delta E trend",
      body: `Recent average Delta E is ${recentAverage.toFixed(2)}, ${movement}.`,
      bullets: [
        highest
          ? `Peak Delta E is ${Number(highest.delta_e).toFixed(2)} on ${lotLabel(highest)}.`
          : "No Delta E values are available yet.",
        `${trend.length} recent points are included in this view.`,
      ],
      tone: recentAverage >= 5 ? "warning" : "neutral",
    };
  }

  return {
    title: "Manager QC summary",
    body: `${summary.cleared} pass, ${summary.rejected} reject, ${warnings} warning from ${rows.length} lots.`,
    bullets: [
      weakest
        ? `Watch ${weakest.productName}: ${formatPercent(weakest.passRate)} pass rate.`
        : "No product pass-rate split available yet.",
      highest
        ? `Highest Delta E is ${Number(highest.delta_e).toFixed(2)} on ${lotLabel(highest)}.`
        : "No Delta E values are available yet.",
    ],
    tone: summary.rejected > 0 ? "reject" : warnings > 0 ? "warning" : "pass",
  };
}
