import { readFileSync } from "node:fs";

const REQUIRED_FIELDS = {
  products: ["version"],
  qc_lots: ["warning_flag", "qc_stage", "reference_version"],
};

function loadEnvFile(path = ".env.local") {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return env;
}

function fieldName(row) {
  return row?.field ?? row?.name ?? row?.key ?? "";
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers, cache: "no-store" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 240)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function checkFields(baseUrl, headers, collection, requiredFields) {
  const json = await fetchJson(`${baseUrl}/api/fields/${collection}`, headers);
  const fields = Array.isArray(json.data) ? json.data.map(fieldName).filter(Boolean) : [];
  const missing = requiredFields.filter((field) => !fields.includes(field));
  return {
    collection,
    ready: missing.length === 0,
    missing,
  };
}

async function checkDemoSeed(baseUrl, headers) {
  const json = await fetchJson(`${baseUrl}/api/items/qc_lots?limit=500&sort=-checked_at`, headers);
  const lots = Array.isArray(json.data) ? json.data : [];
  const productIds = new Set(
    lots
      .map((lot) =>
        typeof lot.product_id === "string" ? lot.product_id : lot.product_id?.id ?? ""
      )
      .filter(Boolean)
  );
  const counts = {
    totalLots: lots.length,
    productCount: productIds.size,
    passLots: lots.filter((lot) => lot.status === "pass").length,
    rejectLots: lots.filter((lot) => lot.status === "reject").length,
    warningLots: lots.filter((lot) => lot.warning_flag === true).length,
    incomingLots: lots.filter((lot) => lot.qc_stage === "incoming").length,
    finishLots: lots.filter((lot) => lot.qc_stage === "finish").length,
  };
  const missing = [];
  if (counts.productCount < 2) missing.push("at least 2 seeded products");
  if (counts.passLots < 4) missing.push("at least 4 PASS lots");
  if (counts.rejectLots < 2) missing.push("at least 2 REJECT lots");
  if (counts.warningLots < 1) missing.push("at least 1 warning_flag lot");
  if (counts.incomingLots < 1) missing.push("at least 1 incoming QC lot");
  if (counts.finishLots < 1) missing.push("at least 1 finish QC lot");

  return { ...counts, ready: missing.length === 0, missing };
}

async function main() {
  const env = loadEnvFile();
  const baseUrl = (env.BUILDPAD_DAAS_URL ?? env.NEXT_PUBLIC_BUILDPAD_DAAS_URL ?? "").replace(
    /\/$/,
    ""
  );
  const token = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl) throw new Error("Missing BUILDPAD_DAAS_URL or NEXT_PUBLIC_BUILDPAD_DAAS_URL.");
  if (!token) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const schemaChecks = [];
  for (const [collection, fields] of Object.entries(REQUIRED_FIELDS)) {
    schemaChecks.push(await checkFields(baseUrl, headers, collection, fields));
  }

  const demoSeed = await checkDemoSeed(baseUrl, headers);
  const ready = schemaChecks.every((check) => check.ready) && demoSeed.ready;

  console.log(
    JSON.stringify(
      {
        ready,
        schemaChecks,
        demoSeed,
      },
      null,
      2
    )
  );

  if (!ready) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`DaaS readiness check failed: ${error.message}`);
  process.exitCode = 1;
});
