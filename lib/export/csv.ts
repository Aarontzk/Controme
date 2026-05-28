export type CsvPrimitive = string | number | boolean | null | undefined;

export function toCsvValue(value: CsvPrimitive): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function buildLotCsv(row: Record<string, CsvPrimitive>): string {
  const headers = Object.keys(row);
  const values = headers.map((header) => toCsvValue(row[header]));
  return `${headers.map(toCsvValue).join(",")}\r\n${values.join(",")}\r\n`;
}
