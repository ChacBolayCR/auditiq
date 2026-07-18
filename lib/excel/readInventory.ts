import * as XLSX from "xlsx";
import type { ColumnMapping, InventoryRow, InventoryWorkbook } from "@/types/audit";
import { parseLocaleNumber } from "@/lib/numberParser";

export async function readInventoryFile(file: File): Promise<InventoryWorkbook> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array", raw: false });
  if (!workbook.SheetNames.length) throw new Error("El archivo no contiene hojas.");
  const result = readSheet(workbook, file.name, workbook.SheetNames[0]);
  result.sheets = Object.fromEntries(workbook.SheetNames.map((sheetName) => [sheetName, XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" })]));
  return result;
}
export function readSheet(workbook: XLSX.WorkBook, name: string, sheetName: string): InventoryWorkbook {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { name, sheetNames: workbook.SheetNames, selectedSheet: sheetName, rows, headers };
}
export function autoMap(headers: string[]): ColumnMapping {
  const find = (terms: string[]) => headers.find((h) => terms.some((t) => h.toLowerCase().includes(t))) ?? "";
  return { code: find(["código", "codigo", "sku", "artículo", "articulo"]), description: find(["descripción", "descripcion", "producto", "artículo", "articulo"]), quantity: find(["existencia", "cantidad", "stock", "conteo"]), cost: find(["precio", "costo", "coste"]) };
}
export function mapInventory(rows: Record<string, unknown>[], mapping: ColumnMapping): InventoryRow[] {
  return rows.map((row, index) => ({ id: `inv-${index}`, code: mapping.code ? String(row[mapping.code] ?? "") : "", description: String(row[mapping.description] ?? ""), quantity: parseLocaleNumber(row[mapping.quantity]).value, cost: mapping.cost ? parseLocaleNumber(row[mapping.cost]).value : undefined, original: row }));
}
