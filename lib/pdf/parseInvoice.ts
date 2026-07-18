import type { InvoiceHeader, InvoiceLine } from "@/types/audit";
import { parseLocaleNumber } from "@/lib/numberParser";

const money = /[-+]?[$₡€]?\s*\d[\d.,\s]*/;
const take = (text: string, pattern: RegExp) => text.match(pattern)?.[1]?.trim() ?? "";

export function parseInvoice(text: string, fileName: string): { header: InvoiceHeader; lines: InvoiceLine[] } {
  const header: InvoiceHeader = {
    invoiceNumber: take(text, /(?:factura|invoice|n[úu]mero|no\.?)[\s:#-]*([A-Z0-9-]{3,})/i),
    date: take(text, /(?:fecha|date)[\s:#-]*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/i),
    supplier: take(text, /(?:proveedor|supplier|emisor|raz[oó]n social)[\s:#-]*([^\n]{3,60})/i),
    currency: /₡|\bCRC\b/i.test(text) ? "CRC" : /\$|\bUSD\b/i.test(text) ? "USD" : "",
    subtotal: parseLocaleNumber(take(text, new RegExp(`subtotal\\s*[:]?\\s*(${money.source})`, "i"))).value,
    taxes: parseLocaleNumber(take(text, new RegExp(`(?:impuesto|iva|tax)\\s*[:]?\\s*(${money.source})`, "i"))).value,
    discounts: parseLocaleNumber(take(text, new RegExp(`(?:descuento|discount)\\s*[:]?\\s*(${money.source})`, "i"))).value,
    total: parseLocaleNumber(take(text, new RegExp(`(?:total(?:\\s+factura)?|importe total)\\s*[:]?\\s*(${money.source})`, "i"))).value,
  };
  const rows = text.split(/\n|\s{3,}/).map((line) => line.trim()).filter(Boolean);
  const lines: InvoiceLine[] = [];
  const rowPattern = /^([A-Z0-9][A-Z0-9._/-]{1,24})\s+(.{3,80}?)\s+(\d+(?:[.,]\d+)?)\s+([$₡€]?\s*\d[\d.,]*)\s+([$₡€]?\s*\d[\d.,]*)$/i;
  rows.forEach((row, index) => {
    const match = row.match(rowPattern);
    if (!match || /^(total|subtotal|impuesto|codigo|sku|producto)/i.test(match[1])) return;
    const quantity = parseLocaleNumber(match[3]).value;
    const unitPrice = parseLocaleNumber(match[4]).value;
    const lineTotal = parseLocaleNumber(match[5]).value;
    const incomplete = !match[2] || quantity === undefined || unitPrice === undefined || lineTotal === undefined;
    lines.push({ id: `${fileName}-${index}-${crypto.randomUUID()}`, fileName, invoiceNumber: header.invoiceNumber, date: header.date, supplier: header.supplier, code: match[1], description: match[2], quantity, unitPrice, tax: 0, lineTotal, status: incomplete ? "Revisión requerida" : "Válido", observation: incomplete ? "Complete o valide los datos extraídos." : "" });
  });
  if (!lines.length) lines.push({ id: crypto.randomUUID(), fileName, invoiceNumber: header.invoiceNumber, date: header.date, supplier: header.supplier, code: "", description: "", status: "Revisión requerida", observation: "No se detectaron líneas automáticamente; complete la fila manualmente." });
  return { header, lines };
}
