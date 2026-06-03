import { describe, expect, it } from "vitest";

import {
  extractLinks,
  isBriefNotification,
  isVisibleNotification,
  levelTone,
  parseBrief,
  sortNotifications,
  unreadCount,
  type QcNotificationRow,
} from "./notifications";

const briefMessage = [
  "QC Daily Brief 2026-06-03 — 2 aksi prioritas",
  "38 lot / 7 hari, reject 79%.",
  "",
  "1. [P3] Reject rate 79% (30/38)",
  "   -> AKSI: Audit lot reject.",
  "   link: /qc/lots?status=reject",
  "",
  "2. [P2] Spray-Dried Ginger Powder: 26/28 reject (93%)",
  "   -> AKSI: Re-verify reference Lab.",
  "   link: /qc/products/c4c1ccb9-47f9-4217-a992-4e8fd366f890",
].join("\n");

describe("parseBrief", () => {
  it("splits title, summary, body and links", () => {
    const parsed = parseBrief(briefMessage);
    expect(parsed.title).toBe("QC Daily Brief 2026-06-03 — 2 aksi prioritas");
    expect(parsed.summary).toBe("38 lot / 7 hari, reject 79%.");
    expect(parsed.body).toContain("1. [P3] Reject rate 79%");
    expect(parsed.links).toEqual([
      "/qc/lots?status=reject",
      "/qc/products/c4c1ccb9-47f9-4217-a992-4e8fd366f890",
    ]);
  });

  it("treats a numbered second line as body, not summary", () => {
    const parsed = parseBrief("Header\n1. first action");
    expect(parsed.summary).toBe("");
    expect(parsed.body).toBe("1. first action");
  });

  it("degrades gracefully for a plain alert", () => {
    const parsed = parseBrief("Lot REJECT ΔE 30.8");
    expect(parsed.title).toBe("Lot REJECT ΔE 30.8");
    expect(parsed.body).toBe("");
    expect(parsed.links).toEqual([]);
  });

  it("handles null/empty messages", () => {
    expect(parseBrief(null).title).toBe("");
    expect(parseBrief(undefined).links).toEqual([]);
  });
});

describe("extractLinks", () => {
  it("dedupes and trims trailing punctuation", () => {
    expect(extractLinks("see /qc/lots?status=reject. and /qc/lots?status=reject")).toEqual([
      "/qc/lots?status=reject",
    ]);
  });

  it("returns empty for no links", () => {
    expect(extractLinks("no links here")).toEqual([]);
  });
});

describe("levelTone", () => {
  it("maps alert and warning", () => {
    expect(levelTone("alert")).toBe("reject");
    expect(levelTone("warning")).toBe("warning");
    expect(levelTone(null)).toBe("neutral");
  });
});

describe("visibility and classification", () => {
  it("hides voided rows", () => {
    expect(isVisibleNotification({ id: "1", status: "void" })).toBe(false);
    expect(isVisibleNotification({ id: "2", status: "digest" })).toBe(true);
  });

  it("identifies brief rows", () => {
    expect(isBriefNotification({ id: "1", status: "digest" })).toBe(true);
    expect(isBriefNotification({ id: "2", status: "demo" })).toBe(true);
    expect(isBriefNotification({ id: "3", status: "reject" })).toBe(false);
  });
});

describe("unreadCount", () => {
  it("counts unread visible rows only", () => {
    const rows: QcNotificationRow[] = [
      { id: "1", read: false, status: "digest" },
      { id: "2", read: true, status: "digest" },
      { id: "3", read: false, status: "void" },
    ];
    expect(unreadCount(rows)).toBe(1);
  });
});

describe("sortNotifications", () => {
  it("puts unread first, then newest first, and drops voided", () => {
    const rows: QcNotificationRow[] = [
      { id: "read-new", read: true, date_created: "2026-06-03T10:00:00Z" },
      { id: "unread-old", read: false, date_created: "2026-06-01T10:00:00Z" },
      { id: "unread-new", read: false, date_created: "2026-06-02T10:00:00Z" },
      { id: "void", read: false, status: "void", date_created: "2026-06-09T10:00:00Z" },
    ];
    expect(sortNotifications(rows).map((r) => r.id)).toEqual([
      "unread-new",
      "unread-old",
      "read-new",
    ]);
  });
});
