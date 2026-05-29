export interface FieldLike {
  field?: string;
  name?: string;
  key?: string;
}

export interface SchemaReadinessCheck {
  collection: string;
  requiredFields: string[];
  presentFields: string[];
  missingFields: string[];
  ready: boolean;
}

export interface DemoSeedLot {
  id?: string;
  product_id?: string | { id?: string } | null;
  status?: string | null;
  warning_flag?: boolean | null;
  qc_stage?: string | null;
}

export interface DemoSeedReadiness {
  totalLots: number;
  passLots: number;
  rejectLots: number;
  warningLots: number;
  incomingLots: number;
  finishLots: number;
  productCount: number;
  ready: boolean;
  missing: string[];
}

export const REQUIRED_DAAS_FIELDS = {
  products: ["version"],
  qc_lots: ["warning_flag", "qc_stage", "reference_version"],
} as const;

export function extractFieldNames(payload: unknown): string[] {
  const root =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  const rows = Array.isArray(root)
    ? root
    : root && typeof root === "object" && "fields" in root && Array.isArray((root as { fields?: unknown }).fields)
      ? (root as { fields: unknown[] }).fields
      : [];

  const names = rows
    .map((row) => {
      if (!row || typeof row !== "object") return "";
      const field = row as FieldLike;
      return field.field ?? field.name ?? field.key ?? "";
    })
    .filter(Boolean);

  return [...new Set(names)].sort();
}

export function buildSchemaReadinessCheck(
  collection: string,
  fieldPayload: unknown,
  requiredFields: readonly string[]
): SchemaReadinessCheck {
  const presentFields = extractFieldNames(fieldPayload);
  const missingFields = requiredFields.filter((field) => !presentFields.includes(field));

  return {
    collection,
    requiredFields: [...requiredFields],
    presentFields,
    missingFields,
    ready: missingFields.length === 0,
  };
}

function productIdFromLot(lot: DemoSeedLot): string {
  if (!lot.product_id) return "";
  return typeof lot.product_id === "string" ? lot.product_id : lot.product_id.id ?? "";
}

export function buildDemoSeedReadiness(lots: DemoSeedLot[]): DemoSeedReadiness {
  const products = new Set(lots.map(productIdFromLot).filter(Boolean));
  const passLots = lots.filter((lot) => lot.status === "pass").length;
  const rejectLots = lots.filter((lot) => lot.status === "reject").length;
  const warningLots = lots.filter((lot) => lot.warning_flag === true).length;
  const incomingLots = lots.filter((lot) => lot.qc_stage === "incoming").length;
  const finishLots = lots.filter((lot) => lot.qc_stage === "finish").length;

  const missing: string[] = [];
  if (products.size < 2) missing.push("at least 2 seeded products");
  if (passLots < 4) missing.push("at least 4 PASS lots");
  if (rejectLots < 2) missing.push("at least 2 REJECT lots");
  if (warningLots < 1) missing.push("at least 1 warning_flag lot");
  if (incomingLots < 1) missing.push("at least 1 incoming QC lot");
  if (finishLots < 1) missing.push("at least 1 finish QC lot");

  return {
    totalLots: lots.length,
    passLots,
    rejectLots,
    warningLots,
    incomingLots,
    finishLots,
    productCount: products.size,
    ready: missing.length === 0,
    missing,
  };
}
