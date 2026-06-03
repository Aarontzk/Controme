import { describe, expect, it } from "vitest";

import {
  ageMinutes,
  healthLabel,
  healthTone,
  latestSample,
  HEARTBEAT_STALE_MS,
  type SystemHealthRow,
} from "./system-health";

const NOW = Date.parse("2026-06-03T15:30:00.000Z");

function sample(over: Partial<SystemHealthRow> = {}): SystemHealthRow {
  return {
    service: "daas",
    status: "ok",
    latency_ms: 40,
    detail: { lots_24h: 2, last_lot_age_min: 91 },
    checked_at: new Date(NOW - 60_000).toISOString(),
    ...over,
  };
}

describe("latestSample", () => {
  it("returns the newest row by checked_at", () => {
    const older = sample({ checked_at: "2026-06-03T15:00:00.000Z" });
    const newer = sample({ checked_at: "2026-06-03T15:20:00.000Z" });
    expect(latestSample([older, newer])).toBe(newer);
  });

  it("ignores rows with missing/invalid timestamps", () => {
    const good = sample({ checked_at: "2026-06-03T15:20:00.000Z" });
    expect(latestSample([{ checked_at: null }, { checked_at: "nope" }, good])).toBe(
      good
    );
  });

  it("returns null for an empty list", () => {
    expect(latestSample([])).toBeNull();
  });
});

describe("healthTone", () => {
  it("is ok for a fresh ok sample", () => {
    expect(healthTone(sample(), NOW)).toBe("ok");
  });

  it("passes through warn", () => {
    expect(healthTone(sample({ status: "warn" }), NOW)).toBe("warn");
  });

  it("treats a stale heartbeat as down even when status is ok", () => {
    const stale = sample({
      status: "ok",
      checked_at: new Date(NOW - HEARTBEAT_STALE_MS - 1000).toISOString(),
    });
    expect(healthTone(stale, NOW)).toBe("down");
  });

  it("is down when there is no sample", () => {
    expect(healthTone(null, NOW)).toBe("down");
  });
});

describe("ageMinutes", () => {
  it("rounds to whole minutes", () => {
    expect(ageMinutes(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe(5);
  });

  it("never returns negative", () => {
    expect(ageMinutes(new Date(NOW + 60_000).toISOString(), NOW)).toBe(0);
  });

  it("returns null for missing/invalid input", () => {
    expect(ageMinutes(null, NOW)).toBeNull();
    expect(ageMinutes("not-a-date", NOW)).toBeNull();
  });
});

describe("healthLabel", () => {
  it("maps tones to labels", () => {
    expect(healthLabel("ok")).toBe("Operational");
    expect(healthLabel("warn")).toBe("Degraded");
    expect(healthLabel("down")).toBe("Down / stale");
  });
});
