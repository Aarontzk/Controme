/**
 * Idempotent DaaS RBAC + CORS bootstrap.
 *
 * Makes the runtime DaaS configuration reproducible instead of hand-applied via
 * MCP. Safe to run repeatedly — it only adds what is missing and never removes
 * existing config.
 *
 * What it ensures:
 *   1. CORS origins include the local dev + E2E ports (union with whatever is
 *      already set, e.g. the Amplify URL), with credentials enabled.
 *   2. The `daas_files` permissions the authenticated QC flow needs:
 *        - policies that can CREATE qc_lots (operators)  -> files create+read+update
 *        - policies that can READ   qc_lots (all viewers) -> files read
 *      Policies are resolved dynamically from existing qc_lots permissions, so
 *      this works on any instance without hard-coded policy UUIDs.
 *
 * Auth: DaaS static token (Bearer), same as the readiness check. NOT the
 * Supabase service-role key.
 *
 * Usage: `pnpm daas:setup`  (reads .env.local)
 */

import { readFileSync } from "node:fs";

// Local dev + Playwright E2E origins that must always be allowed. The Amplify
// (and any other already-configured) origin is preserved via union.
const REQUIRED_LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3100",
];

const FILES_COLLECTION = "daas_files";
const QC_COLLECTION = "qc_lots";

function loadEnvFile(path = ".env.local") {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index).trim()] = trimmed
      .slice(index + 1)
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
    throw new Error(`${method} ${path} -> ${response.status}: ${text.slice(0, 240)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function ensureCors(baseUrl, headers) {
  const current = (await daas(baseUrl, headers, "GET", "/api/settings/cors")).data ?? {};
  const existing = Array.isArray(current.cors_origins) ? current.cors_origins : [];
  const merged = [...new Set([...existing, ...REQUIRED_LOCAL_ORIGINS])];
  const added = merged.filter((origin) => !existing.includes(origin));

  if (added.length === 0 && current.cors_allow_credentials === true && current.cors_enabled) {
    return { changed: false, origins: existing };
  }

  await daas(baseUrl, headers, "PATCH", "/api/settings/cors", {
    cors_enabled: true,
    cors_allow_credentials: true,
    cors_origins: merged,
  });
  return { changed: true, added, origins: merged };
}

function policyId(row) {
  return typeof row.policy === "string" ? row.policy : row.policy?.id ?? null;
}

async function ensureFilePermissions(baseUrl, headers) {
  // Resolve policies from who can act on qc_lots — instance-agnostic.
  const qcPerms = (
    await daas(
      baseUrl,
      headers,
      "GET",
      `/api/permissions?filter[collection][_eq]=${QC_COLLECTION}&limit=-1`
    )
  ).data ?? [];

  const creatorPolicies = new Set();
  const readerPolicies = new Set();
  for (const row of qcPerms) {
    const id = policyId(row);
    if (!id) continue;
    if (row.action === "create") creatorPolicies.add(id);
    if (row.action === "read") readerPolicies.add(id);
  }

  // Desired (policy, action) set on daas_files.
  const desired = new Map(); // key `${policy}:${action}` -> {policy, action}
  const want = (policy, action) => desired.set(`${policy}:${action}`, { policy, action });
  for (const policy of creatorPolicies) {
    want(policy, "create");
    want(policy, "read");
    want(policy, "update");
  }
  for (const policy of readerPolicies) {
    want(policy, "read");
  }

  // Existing daas_files perms.
  const existing = (
    await daas(
      baseUrl,
      headers,
      "GET",
      `/api/permissions?filter[collection][_eq]=${FILES_COLLECTION}&limit=-1`
    )
  ).data ?? [];
  const have = new Set(existing.map((row) => `${policyId(row)}:${row.action}`));

  const toCreate = [...desired.values()]
    .filter(({ policy, action }) => !have.has(`${policy}:${action}`))
    .map(({ policy, action }) => ({
      policy,
      collection: FILES_COLLECTION,
      action,
      fields: ["*"],
    }));

  if (toCreate.length > 0) {
    await daas(baseUrl, headers, "POST", "/api/permissions", toCreate);
  }

  return {
    creatorPolicies: [...creatorPolicies],
    readerPolicies: [...readerPolicies],
    created: toCreate.map(({ policy, action }) => `${action} (${policy})`),
  };
}

async function main() {
  const env = loadEnvFile();
  const baseUrl = (env.BUILDPAD_DAAS_URL ?? env.NEXT_PUBLIC_BUILDPAD_DAAS_URL ?? "").replace(
    /\/$/,
    ""
  );
  const token = env.DAAS_STATIC_TOKEN;
  if (!baseUrl) throw new Error("Missing BUILDPAD_DAAS_URL or NEXT_PUBLIC_BUILDPAD_DAAS_URL.");
  if (!token) throw new Error("Missing DAAS_STATIC_TOKEN.");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const cors = await ensureCors(baseUrl, headers);
  const files = await ensureFilePermissions(baseUrl, headers);

  console.log(JSON.stringify({ cors, files }, null, 2));
}

main().catch((error) => {
  console.error(`DaaS RBAC setup failed: ${error.message}`);
  process.exitCode = 1;
});
