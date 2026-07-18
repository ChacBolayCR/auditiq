import type { ComparisonRow, ConsolidatedProduct, InventoryRow, InvoiceLine } from "@/types/audit";
import { normalizeCode, normalizeDescription } from "./normalization";

export function consolidateLines(lines: InvoiceLine[]): ConsolidatedProduct[] {
  const groups = new Map<string, InvoiceLine[]>();
  lines.filter((line) => line.description.trim()).forEach((line) => {
    const code = normalizeCode(line.code); const desc = normalizeDescription(line.description);
    const key = code ? `code:${code}` : `desc:${desc}`;
    groups.set(key, [...(groups.get(key) ?? []), line]);
  });
  return [...groups.entries()].map(([key, rows]) => {
    const prices = rows.map((r) => r.unitPrice).filter((v): v is number => v !== undefined);
    const files = [...new Set(rows.map((r) => r.fileName))];
    return { key, code: rows.find((r) => r.code)?.code ?? "", description: rows[0].description, normalizedCode: normalizeCode(rows[0].code), normalizedDescription: normalizeDescription(rows[0].description), billedQuantity: rows.reduce((s, r) => s + (r.quantity ?? 0), 0), averagePrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0, minPrice: prices.length ? Math.min(...prices) : 0, maxPrice: prices.length ? Math.max(...prices) : 0, billedTotal: rows.reduce((s, r) => s + (r.lineTotal ?? (r.quantity ?? 0) * (r.unitPrice ?? 0)), 0), invoiceCount: files.length, files, suppliers: [...new Set(rows.map((r) => r.supplier).filter(Boolean))], lines: rows };
  });
}

export function compareProducts(products: ConsolidatedProduct[], inventory: InventoryRow[], includeOnlyInventory = true): ComparisonRow[] {
  const used = new Set<string>();
  const result: ComparisonRow[] = products.map((product) => {
    let match = product.normalizedCode ? inventory.find((r) => normalizeCode(r.code) === product.normalizedCode) : undefined;
    let method = match ? "Código exacto" : "";
    if (!match) { match = inventory.find((r) => normalizeDescription(r.description) === product.normalizedDescription); method = match ? "Descripción exacta" : "Sin coincidencia"; }
    if (match) used.add(match.id);
    const difference = match?.quantity === undefined ? undefined : match.quantity - product.billedQuantity;
    const status = !match ? "No encontrado" : difference === 0 ? "Coincide" : (difference ?? 0) < 0 ? "Faltante" : "Sobrante";
    return { id: product.key, code: product.code, product: product.description, billedQuantity: product.billedQuantity, inventoryQuantity: match?.quantity, difference, averagePrice: product.averagePrice, billedTotal: product.billedTotal, status, matchMethod: method, observation: !match ? "No aparece en el inventario importado." : "" } satisfies ComparisonRow;
  });
  if (includeOnlyInventory) inventory.filter((r) => !used.has(r.id)).forEach((r) => result.push({ id: `inventory:${r.id}`, code: r.code, product: r.description, billedQuantity: 0, inventoryQuantity: r.quantity, difference: r.quantity, averagePrice: r.cost ?? 0, billedTotal: 0, status: "Solo en inventario", matchMethod: "Sin factura", observation: "Producto presente únicamente en inventario." }));
  return result;
}
