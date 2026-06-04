/**
 * Pure helpers for the manager Notifications panel.
 *
 * The QC daily CTA brief (cron `qc-daily-cta-brief`) and the per-lot reject
 * alerts (extension `qc-reject-notify`) both write rows to the `qc_notifications`
 * collection. This module shapes those rows for display: parsing the multiline
 * brief message, filtering out voided rows, ranking, and counting unread.
 */

export interface QcNotificationRow {
  id: string;
  level?: string | null; // "alert" | "warning"
  status?: string | null; // "digest" | "demo" | per-lot status | "void"
  message?: string | null;
  read?: boolean | null;
  date_created?: string | null;
  product_id?: string | null;
  lot_id?: string | null;
  delta_e?: number | null;
}

export interface ParsedBrief {
  title: string;
  summary: string;
  body: string;
  links: string[];
}

export type NotificationTone = "reject" | "warning" | "neutral";

const VOID_STATUSES = new Set(["void"]);
const BRIEF_STATUSES = new Set(["digest", "demo"]);

/** Rows that should appear in the manager feed (voided rows are hidden). */
export function isVisibleNotification(row: QcNotificationRow): boolean {
  return !VOID_STATUSES.has((row.status ?? "").toLowerCase());
}

/** A scheduled CTA brief (as opposed to a single-lot reject alert). */
export function isBriefNotification(row: QcNotificationRow): boolean {
  return BRIEF_STATUSES.has((row.status ?? "").toLowerCase());
}

/** Visual tone for a notification level. */
export function levelTone(level: string | null | undefined): NotificationTone {
  const value = (level ?? "").toLowerCase();
  if (value === "alert") return "reject";
  if (value === "warning") return "warning";
  return "neutral";
}

/** Unread count among visible rows. */
export function unreadCount(rows: readonly QcNotificationRow[]): number {
  return rows.filter((row) => isVisibleNotification(row) && !row.read).length;
}

export type NotificationKind = "all" | "brief" | "alert" | "warning";

/** Bucket a row for the panel filter: brief (CTA digest) vs alert vs warning. */
export function notificationKind(
  row: QcNotificationRow
): "brief" | "alert" | "warning" | "other" {
  if (isBriefNotification(row)) return "brief";
  const tone = levelTone(row.level);
  if (tone === "reject") return "alert";
  if (tone === "warning") return "warning";
  return "other";
}

/** Visible rows matching the selected kind and (optionally) unread-only. */
export function filterNotifications(
  rows: readonly QcNotificationRow[],
  kind: NotificationKind,
  unreadOnly: boolean
): QcNotificationRow[] {
  return rows.filter((row) => {
    if (!isVisibleNotification(row)) return false;
    if (unreadOnly && row.read) return false;
    if (kind !== "all" && notificationKind(row) !== kind) return false;
    return true;
  });
}

/** Count of visible rows per kind, for filter badges. */
export function kindCounts(
  rows: readonly QcNotificationRow[]
): Record<NotificationKind, number> {
  const counts: Record<NotificationKind, number> = {
    all: 0,
    brief: 0,
    alert: 0,
    warning: 0,
  };
  for (const row of rows) {
    if (!isVisibleNotification(row)) continue;
    counts.all += 1;
    const kind = notificationKind(row);
    if (kind !== "other") counts[kind] += 1;
  }
  return counts;
}

/**
 * Newest first, but unread always ahead of read so a manager sees fresh actions
 * at the top regardless of when an old one was finally acknowledged.
 */
export function sortNotifications(
  rows: readonly QcNotificationRow[]
): QcNotificationRow[] {
  return [...rows].filter(isVisibleNotification).sort((a, b) => {
    const readDiff = Number(Boolean(a.read)) - Number(Boolean(b.read));
    if (readDiff !== 0) return readDiff;
    const aTime = a.date_created ? Date.parse(a.date_created) : 0;
    const bTime = b.date_created ? Date.parse(b.date_created) : 0;
    return bTime - aTime;
  });
}

/** Extract internal deep-links (e.g. "/qc/lots?status=reject") from a message. */
export function extractLinks(message: string | null | undefined): string[] {
  if (!message) return [];
  const re = /\/qc\/[A-Za-z0-9_\-/?=&.]+/g;
  const found = message.match(re) ?? [];
  return [...new Set(found.map((link) => link.replace(/[).,]+$/, "")))];
}

/**
 * Split a brief message into title (first line), an optional summary line, the
 * remaining body, and any deep-links. Non-brief alerts degrade gracefully:
 * the whole message becomes the title with an empty body.
 */
export function parseBrief(message: string | null | undefined): ParsedBrief {
  const text = (message ?? "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const title = (lines[0] ?? "").trim();

  let summary = "";
  let rest = lines.slice(1);
  const firstRest = (rest[0] ?? "").trim();
  if (firstRest && !/^\d+\./.test(firstRest)) {
    summary = firstRest;
    rest = rest.slice(1);
  }

  const body = rest.join("\n").trim();
  return { title, summary, body, links: extractLinks(text) };
}
