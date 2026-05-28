import { type NextRequest, NextResponse } from "next/server";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import { getRoleNames, requireRole } from "@/lib/auth/role-gating";

type Params = { params: Promise<{ id: string }> };

function pdfText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildSimplePdf(lines: string[]): Uint8Array {
  const objects: string[] = [];
  const content = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...lines.flatMap((line, index) =>
      index === 0 ? [`(${pdfText(line)}) Tj`] : ["0 -18 Td", `(${pdfText(line)}) Tj`]
    ),
    "ET",
  ].join("\n");

  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");
  objects.push("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n");
  objects.push(
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
  );
  objects.push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n");
  objects.push(`5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj\n`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += object;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const headers = await getAuthHeaders();
  if (!headers.Authorization) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const response = await fetch(`${getDaaSUrl()}/api/items/qc_lots/${id}`, {
    headers,
    cache: "no-store",
  });
  const meResponse = await fetch(`${getDaaSUrl()}/api/users/me`, {
    headers,
    cache: "no-store",
  });
  if (!meResponse.ok) {
    return NextResponse.json({ error: "Unable to verify export role." }, { status: 403 });
  }
  const meJson = (await meResponse.json()) as { data?: Parameters<typeof getRoleNames>[0] };
  const roles = getRoleNames(meJson.data);
  if (!requireRole(roles, ["admin", "manager"])) {
    return NextResponse.json({ error: "Export requires Manager or Admin." }, { status: 403 });
  }
  if (!response.ok) {
    return NextResponse.json({ error: "Lot not found." }, { status: response.status });
  }

  const json = (await response.json()) as { data?: Record<string, unknown> };
  const lot = json.data ?? {};
  const pdf = buildSimplePdf([
    "Controme QC Lot Export",
    `Lot ID: ${String(lot.id ?? id)}`,
    `Lot code: ${String(lot.lot_code ?? "-")}`,
    `QC stage: ${String(lot.qc_stage ?? "-")}`,
    `Timestamp: ${String(lot.checked_at ?? "-")}`,
    `Status: ${String(lot.status ?? "-")}`,
    `Warning: ${String(lot.warning_flag ?? false)}`,
    `L*: ${String(lot.l_value ?? "-")}`,
    `a*: ${String(lot.a_value ?? "-")}`,
    `b*: ${String(lot.b_value ?? "-")}`,
    `Delta E: ${String(lot.delta_e ?? "-")}`,
    `Reject reason: ${String(lot.reject_reason ?? "None")}`,
    `Operator: ${String(lot.operator_id ?? "-")}`,
    `Photo file: ${String(lot.photo ?? "-")}`,
  ]);

  const body = pdf.buffer.slice(
    pdf.byteOffset,
    pdf.byteOffset + pdf.byteLength
  ) as ArrayBuffer;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="qc-lot-${id}.pdf"`,
    },
  });
}
