/**
 * Demo lot seeder — idempotent by lot_code prefix.
 *
 * Creates realistic demo data for the Controme QC dashboard.
 * The existing lots from E2E tests are all skewed toward REJECTs.
 * This script inserts proper PASS/WARNING/REJECT distribution so the
 * Manager Dashboard shows a realistic ~75% pass rate.
 *
 * Lots are inserted WITHOUT a photo (photo: null) — this is admin seed
 * data, not operator-captured QC. The photo field is nullable in the schema.
 *
 * Usage: pnpm daas:seed
 *
 * Safe to re-run — checks lot_code prefix and skips if already seeded.
 */

import { readFileSync } from "node:fs";

// ─── reference values from PRD §5.4 ──────────────────────────────────────────
const GINGER = {
  refL: 69.52, refA: 9.34, refB: 37.40,
  deltaEMax: 5.0,
  warningThreshold: 4.5,   // 0.90 × 5.0
};
const DRAGON = {
  refL: 45.0, refA: 38.6, refB: -8.3,
  deltaEMax: 4.5,
  warningThreshold: 4.05,  // 0.90 × 4.5
};

function round(n, d = 4) {
  return Math.round(n * 10 ** d) / 10 ** d;
}

function deltaE(L, a, b, ref) {
  return round(
    Math.sqrt((L - ref.refL) ** 2 + (a - ref.refA) ** 2 + (b - ref.refB) ** 2)
  );
}

function classify(de, ref) {
  if (de > ref.deltaEMax) return "reject";
  return "pass";
}

function warningFlag(de, ref) {
  return de > ref.warningThreshold && de <= ref.deltaEMax;
}

/** Date spread: n lots over the past `days` days, newest first. */
function timestamps(count, days = 30) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const offset = Math.floor((i / count) * days * 24 * 60 * 60 * 1000);
    return new Date(now - offset).toISOString();
  });
}

// ─── lot definitions ──────────────────────────────────────────────────────────
// Each entry: { L, a, b, stage, note? }
// ΔE and status are computed from the reference values above.

const GINGER_LOTS = [
  // Clear PASS — stable daily production
  { L: 69.5,  a: 9.3,  b: 37.4, stage: "incoming" },
  { L: 69.0,  a: 9.0,  b: 37.0, stage: "finish" },
  { L: 70.2,  a: 9.6,  b: 37.9, stage: "incoming" },
  { L: 68.8,  a: 9.2,  b: 37.2, stage: "finish" },
  { L: 69.8,  a: 9.5,  b: 38.0, stage: "incoming" },
  { L: 68.5,  a: 8.9,  b: 36.8, stage: "finish" },
  { L: 70.5,  a: 9.8,  b: 38.5, stage: "incoming" },
  { L: 67.9,  a: 8.7,  b: 37.6, stage: "finish" },
  { L: 71.0,  a: 10.1, b: 37.2, stage: "incoming" },
  { L: 69.1,  a: 9.4,  b: 36.9, stage: "finish" },
  { L: 70.0,  a: 9.7,  b: 38.2, stage: "incoming" },
  { L: 68.3,  a: 8.8,  b: 37.8, stage: "finish" },
  { L: 71.3,  a: 10.3, b: 37.0, stage: "incoming" },
  { L: 69.9,  a: 9.1,  b: 38.1, stage: "finish" },
  { L: 68.0,  a: 9.0,  b: 36.5, stage: "incoming" },
  // Slightly off — still PASS
  { L: 72.0,  a: 10.5, b: 36.0, stage: "incoming" },
  { L: 66.8,  a: 8.2,  b: 39.2, stage: "finish" },
  { L: 71.8,  a: 10.8, b: 35.5, stage: "incoming" },
  { L: 67.2,  a: 8.4,  b: 38.9, stage: "finish" },
  { L: 66.5,  a: 8.0,  b: 39.5, stage: "incoming" },
  // Warning band (ΔE 4.5–5.0)
  { L: 73.0,  a: 11.0, b: 34.5, stage: "incoming", note: "Near threshold — monitor batch" },
  { L: 65.8,  a: 7.8,  b: 40.1, stage: "finish",   note: "Warning: lighter than expected" },
  // REJECT — overheat (too dark, b* too low)
  { L: 61.0,  a: 7.0,  b: 32.0, stage: "finish",
    note: "REJECT: process temperature too high — L* significantly below range" },
  { L: 60.5,  a: 6.8,  b: 31.5, stage: "incoming",
    note: "REJECT: dark powder indicates overprocessing" },
];

const DRAGON_LOTS = [
  // Clear PASS — stable production
  { L: 45.2,  a: 38.8, b: -8.5,  stage: "incoming" },
  { L: 44.8,  a: 39.0, b: -8.2,  stage: "finish" },
  { L: 45.8,  a: 38.4, b: -8.0,  stage: "incoming" },
  { L: 44.5,  a: 38.9, b: -8.7,  stage: "finish" },
  { L: 45.5,  a: 38.2, b: -7.9,  stage: "incoming" },
  { L: 44.3,  a: 39.3, b: -8.8,  stage: "finish" },
  { L: 46.0,  a: 38.0, b: -7.7,  stage: "incoming" },
  { L: 43.8,  a: 39.5, b: -9.0,  stage: "finish" },
  { L: 45.9,  a: 37.8, b: -7.6,  stage: "incoming" },
  { L: 44.0,  a: 39.8, b: -9.3,  stage: "finish" },
  { L: 46.2,  a: 37.6, b: -7.4,  stage: "incoming" },
  { L: 43.5,  a: 40.0, b: -9.5,  stage: "finish" },
  { L: 45.3,  a: 38.7, b: -8.4,  stage: "incoming" },
  { L: 44.7,  a: 38.5, b: -8.1,  stage: "finish" },
  { L: 46.5,  a: 37.2, b: -7.2,  stage: "incoming" },
  // Slightly off — still PASS
  { L: 43.0,  a: 40.5, b: -9.8,  stage: "incoming" },
  { L: 47.2,  a: 36.8, b: -6.8,  stage: "finish" },
  { L: 42.8,  a: 40.8, b: -10.0, stage: "incoming" },
  { L: 47.5,  a: 36.5, b: -6.5,  stage: "finish" },
  { L: 42.5,  a: 41.0, b: -10.2, stage: "incoming" },
  // Warning band (ΔE 4.05–4.5) — values verified to land between thresholds
  // ΔE ≈ 4.21: sqrt((42.5-45.0)^2 + (35.8-38.6)^2 + (-6.4-(-8.3))^2) = 4.21
  { L: 42.5,  a: 35.8, b: -6.4,  stage: "incoming",
    note: "Warning: a* dropping — early oxidation signs" },
  // ΔE ≈ 4.49: sqrt((43.0-45.0)^2 + (35.0-38.6)^2 + (-6.5-(-8.3))^2) = 4.49
  { L: 43.0,  a: 35.0, b: -6.5,  stage: "finish",
    note: "Warning: near threshold — check storage temperature" },
  // REJECT — oxidation (Dragon Fruit PRD worked example)
  { L: 47.5,  a: 33.0, b: -4.1,  stage: "finish",
    note: "REJECT: oxidation — a* dropped significantly (betacyanin degradation)" },
  { L: 50.0,  a: 28.0, b: -2.0,  stage: "incoming",
    note: "REJECT: severe oxidation — colour completely out of spec" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function loadEnvFile(path = ".env.local") {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

async function daas(baseUrl, headers, method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function fetchProducts(baseUrl, headers) {
  const json = await daas(baseUrl, headers, "GET", "/api/items/products?limit=50&fields=id,name");
  return Array.isArray(json.data) ? json.data : [];
}

async function fetchExistingLotCodes(baseUrl, headers, prefix) {
  const filter = JSON.stringify({ lot_code: { _starts_with: prefix } });
  const json = await daas(
    baseUrl, headers, "GET",
    `/api/items/qc_lots?limit=200&fields=lot_code&filter=${encodeURIComponent(filter)}`
  );
  return new Set(
    Array.isArray(json.data) ? json.data.map((r) => r.lot_code).filter(Boolean) : []
  );
}

function buildLot(spec, ref, productId, lotCode, checkedAt) {
  const de = deltaE(spec.L, spec.a, spec.b, ref);
  const status = classify(de, ref);
  const wf = warningFlag(de, ref);

  const channelFlags = [];
  const dL = round(spec.L - ref.refL, 2);
  const dA = round(spec.a - ref.refA, 2);
  const dB = round(spec.b - ref.refB, 2);
  if (Math.abs(dL) > (ref.tolL ?? 4.0)) channelFlags.push({ channel: "L*", direction: dL > 0 ? "high" : "low" });
  if (Math.abs(dA) > (ref.tolA ?? 2.0)) channelFlags.push({ channel: "a*", direction: dA > 0 ? "high" : "low" });
  if (Math.abs(dB) > (ref.tolB ?? 3.5)) channelFlags.push({ channel: "b*", direction: dB > 0 ? "high" : "low" });

  return {
    product_id: productId,
    lot_code: lotCode,
    l_value: round(spec.L, 2),
    a_value: round(spec.a, 2),
    b_value: round(spec.b, 2),
    delta_e: de,
    status,
    warning_flag: wf,
    qc_stage: spec.stage,
    reference_version: 1,
    channel_flags: channelFlags,
    contaminant_ratio: 0,
    brightness_stddev: round(1.5 + Math.random() * 1.5, 2),
    texture_contrast: round(0.3 + Math.random() * 0.4, 2),
    reject_reason: status === "reject"
      ? channelFlags.map((f) => f.channel).join(" + ") || "color"
      : null,
    photo: null,
    operator_id: null,
    checked_at: checkedAt,
    note: spec.note ?? null,
  };
}

async function seedCollection(baseUrl, headers, productId, shortCode, lotDefs, ref) {
  const prefix = `SEED-${shortCode}-`;
  const existing = await fetchExistingLotCodes(baseUrl, headers, prefix);

  const times = timestamps(lotDefs.length);
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < lotDefs.length; i++) {
    const lotCode = `${prefix}${String(i + 1).padStart(3, "0")}`;
    if (existing.has(lotCode)) {
      skipped++;
      continue;
    }
    const lot = buildLot(lotDefs[i], ref, productId, lotCode, times[i]);
    await daas(baseUrl, headers, "POST", "/api/items/qc_lots", lot);
    inserted++;
  }

  return { prefix, inserted, skipped, total: lotDefs.length };
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnvFile();
  const baseUrl = (env.BUILDPAD_DAAS_URL ?? env.NEXT_PUBLIC_BUILDPAD_DAAS_URL ?? "").replace(/\/$/, "");
  const token = env.DAAS_STATIC_TOKEN;
  if (!baseUrl) throw new Error("Missing BUILDPAD_DAAS_URL in .env.local");
  if (!token)   throw new Error("Missing DAAS_STATIC_TOKEN in .env.local");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const products = await fetchProducts(baseUrl, headers);
  if (products.length < 2) {
    throw new Error(`Expected ≥2 products, found ${products.length}. Run daas:setup first.`);
  }

  // Match products by name (case-insensitive substring)
  const gingerProduct = products.find((p) =>
    p.name.toLowerCase().includes("ginger")
  );
  const dragonProduct = products.find((p) =>
    p.name.toLowerCase().includes("dragon")
  );
  if (!gingerProduct) throw new Error("Ginger Powder product not found in DaaS.");
  if (!dragonProduct) throw new Error("Dragon Fruit product not found in DaaS.");

  console.log(`Found products:\n  Ginger: ${gingerProduct.id} (${gingerProduct.name})\n  Dragon: ${dragonProduct.id} (${dragonProduct.name})\n`);

  const gingerRef = { ...GINGER, tolL: 4.0, tolA: 2.0, tolB: 3.5 };
  const dragonRef = { ...DRAGON, tolL: 3.5, tolA: 4.0, tolB: 2.5 };

  const gResult = await seedCollection(baseUrl, headers, gingerProduct.id, "GNG", GINGER_LOTS, gingerRef);
  const dResult = await seedCollection(baseUrl, headers, dragonProduct.id, "DRG", DRAGON_LOTS, dragonRef);

  // Summary
  const summary = {
    ginger: { ...gResult },
    dragon: { ...dResult },
  };
  console.log("Seed result:\n" + JSON.stringify(summary, null, 2));

  // Re-run readiness check summary
  const lots = (await daas(baseUrl, headers, "GET", "/api/items/qc_lots?limit=500")).data ?? [];
  const passCount  = lots.filter((l) => l.status === "pass").length;
  const rejectCount = lots.filter((l) => l.status === "reject").length;
  const total = lots.length;
  const rate = total > 0 ? ((passCount / total) * 100).toFixed(1) : "0";
  console.log(`\nDemo dataset: ${total} lots — ${passCount} PASS / ${rejectCount} REJECT (${rate}% pass rate)`);
}

main().catch((err) => {
  console.error(`Seed failed: ${err.message}`);
  process.exitCode = 1;
});
