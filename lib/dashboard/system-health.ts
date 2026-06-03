/**
 * Pure helpers for the manager System Health widget.
 *
 * The `qc-heartbeat` cron writes one row to `system_health` every 10 min with
 * query latency + QC data-freshness. This module shapes the latest sample for
 * display: picking the newest row, classifying status, and flagging a stale
 * heartbeat (cron stopped) independently of the row's own recorded status.
 */

export interface SystemHealthDetail {
  lots_24h?: number | null;
  last_lot_age_min?: number | null;
}

export interface SystemHealthRow {
  service?: string | null;
  status?: string | null; // "ok" | "warn" | "down"
  latency_ms?: number | null;
  detail?: SystemHealthDetail | null;
  checked_at?: string | null;
}

export type HealthTone = "ok" | "warn" | "down";

// If the newest heartbeat is older than this, the cron itself is considered
// stalled — surfaced as "down" regardless of the row's recorded status
// (3 missed 10-min beats).
export const HEARTBEAT_STALE_MS = 30 * 60 * 1000;

/** Newest sample by `checked_at`, or null when there are none. */
export function latestSample(
  rows: readonly SystemHealthRow[]
): SystemHealthRow | null {
  let best: SystemHealthRow | null = null;
  let bestTime = -Infinity;
  for (const row of rows) {
    const time = row.checked_at ? Date.parse(row.checked_at) : NaN;
    if (!Number.isNaN(time) && time > bestTime) {
      bestTime = time;
      best = row;
    }
  }
  return best;
}

/** Effective health tone, treating a stale or absent heartbeat as "down". */
export function healthTone(
  sample: SystemHealthRow | null,
  now: number = Date.now()
): HealthTone {
  if (!sample || !sample.checked_at) return "down";
  const age = now - Date.parse(sample.checked_at);
  if (Number.isNaN(age) || age > HEARTBEAT_STALE_MS) return "down";
  const status = (sample.status ?? "").toLowerCase();
  if (status === "warn") return "warn";
  if (status === "down") return "down";
  return "ok";
}

/** Whole-minutes age of a timestamp, or null when missing/invalid. */
export function ageMinutes(
  iso: string | null | undefined,
  now: number = Date.now()
): number | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.round((now - time) / 60000));
}

/** Human label for a tone. */
export function healthLabel(tone: HealthTone): string {
  if (tone === "ok") return "Operational";
  if (tone === "warn") return "Degraded";
  return "Down / stale";
}
