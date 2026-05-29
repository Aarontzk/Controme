export interface QcExportLotRow {
  id: string;
  checked_at?: string | null;
  product_id?: string | { id?: string; name?: string; sku?: string | null } | null;
  status?: string | null;
  delta_e?: number | null;
  l_value?: number | null;
  a_value?: number | null;
  b_value?: number | null;
  warning_flag?: boolean | null;
  qc_stage?: string | null;
  reference_version?: number | null;
  reject_reason?: string | null;
  operator_id?: string | { id?: string; email?: string | null } | null;
}

export interface QcExportProductRow {
  id: string;
  name: string;
  sku?: string | null;
}

const CSV_HEADERS = [
  "checked_at",
  "lot_id",
  "product_name",
  "product_sku",
  "qc_stage",
  "status",
  "delta_e",
  "l_value",
  "a_value",
  "b_value",
  "warning_flag",
  "reference_version",
  "reject_reason",
  "operator_id",
] as const;

function extractProductId(product: QcExportLotRow["product_id"]): string {
  if (!product) return "";
  return typeof product === "string" ? product : product.id ?? "";
}

function extractOperatorId(operator: QcExportLotRow["operator_id"]): string {
  if (!operator) return "";
  return typeof operator === "string" ? operator : operator.id ?? "";
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildQCCoaCsv(
  lots: QcExportLotRow[],
  products: QcExportProductRow[] = []
): string {
  const productById = new Map(products.map((product) => [product.id, product]));
  const lines = [CSV_HEADERS.join(",")];

  for (const lot of lots) {
    const embeddedProduct =
      typeof lot.product_id === "object" && lot.product_id ? lot.product_id : null;
    const productId = extractProductId(lot.product_id);
    const product = productById.get(productId);

    lines.push(
      [
        lot.checked_at,
        lot.id,
        product?.name ?? embeddedProduct?.name ?? productId,
        product?.sku ?? embeddedProduct?.sku ?? "",
        lot.qc_stage,
        lot.status,
        lot.delta_e,
        lot.l_value,
        lot.a_value,
        lot.b_value,
        lot.warning_flag === true ? "true" : "false",
        lot.reference_version,
        lot.reject_reason,
        extractOperatorId(lot.operator_id),
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return `${lines.join("\r\n")}\r\n`;
}

export function buildQCCoaFilename(date = new Date()): string {
  return `controme-coa-${date.toISOString().slice(0, 10)}.csv`;
}
