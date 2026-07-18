import * as XLSX from "xlsx";
import type { AuditSummary, ComparisonRow, ConsolidatedProduct, InventoryWorkbook, InvoiceFile, InvoiceLine } from "@/types/audit";

interface ExportInput { summary: AuditSummary; comparisons: ComparisonRow[]; consolidated: ConsolidatedProduct[]; lines: InvoiceLine[]; files: InvoiceFile[]; inventory?: InventoryWorkbook; partial?: boolean; tolerance: number; mode: "analyze" | "excel" | "manual"; }
const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0F766E" } } };
function finish(sheet: XLSX.WorkSheet, widths: number[]) {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
  for (let col = range.s.c; col <= range.e.c; col += 1) { const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: col })]; if (cell) cell.s = headerStyle; }
  sheet["!cols"] = widths.map((wch) => ({ wch })); sheet["!autofilter"] = { ref: sheet["!ref"] ?? "A1" }; sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
}
export function exportAuditReport(input: ExportInput) {
  const wb = XLSX.utils.book_new();
  const s = input.summary;
  const summary = XLSX.utils.json_to_sheet([{ "Fecha de generación": new Date().toLocaleString("es-CR"), Facturas: s.invoiceCount, Productos: s.extractedProducts, "Total unidades": s.billedUnits, "Total facturado": s.billedTotal, Coincidencias: s.matches, Faltantes: s.shortages, Sobrantes: s.surpluses, "No encontrados": s.notFound, "Revisión requerida": s.reviewRequired }]);
  finish(summary, [22, 12, 12, 16, 18, 15, 12, 12, 18, 20]); XLSX.utils.book_append_sheet(wb, summary, "Resumen");
  if (input.mode !== "analyze") {
    const comparison = XLSX.utils.json_to_sheet(input.comparisons.map((r) => ({ Código: r.code, Producto: r.product, "Cantidad facturada": r.billedQuantity, "Cantidad inventario": r.inventoryQuantity ?? "", Diferencia: r.difference ?? "", "Precio promedio": r.averagePrice, "Total facturado": r.billedTotal, Estado: r.status, "Método de coincidencia": r.matchMethod, Observación: r.observation })));
    finish(comparison, [16, 35, 18, 18, 12, 16, 16, 20, 22, 35]); XLSX.utils.book_append_sheet(wb, comparison, "Comparación");
  }
  const consolidatedSheet = XLSX.utils.json_to_sheet(input.consolidated.map((p) => ({ Código: p.code, Producto: p.description, "Cantidad total facturada": p.billedQuantity, "Precio promedio": p.averagePrice, "Total facturado": p.billedTotal, "Cantidad de facturas": p.invoiceCount })));
  finish(consolidatedSheet, [18, 40, 24, 18, 18, 22]); XLSX.utils.book_append_sheet(wb, consolidatedSheet, "Productos Consolidados");
  const detail = XLSX.utils.json_to_sheet(input.lines.map((r) => ({ Archivo: r.fileName, "Número de factura": r.invoiceNumber, Fecha: r.date, Proveedor: r.supplier, Código: r.code, Descripción: r.description, Cantidad: r.quantity ?? "", "Precio unitario": r.unitPrice ?? "", Impuesto: r.tax ?? "", "Total de línea": r.lineTotal ?? "", Estado: r.status, Observación: r.observation })));
  finish(detail, [28, 18, 14, 24, 16, 38, 12, 16, 12, 16, 20, 40]); XLSX.utils.book_append_sheet(wb, detail, "Detalle facturas");
  const totalsRows = input.files.map((f) => { const rows = input.lines.filter((r) => r.fileName === f.name); const calculated = rows.reduce((n, r) => n + (r.lineTotal ?? 0), 0); const detected = f.header?.total; const difference = detected === undefined ? "" : detected - calculated; return { Archivo: f.name, "Número de factura": f.header?.invoiceNumber ?? "", Fecha: f.header?.date ?? "", Proveedor: f.header?.supplier ?? "", Unidades: rows.reduce((n, r) => n + (r.quantity ?? 0), 0), Subtotal: f.header?.subtotal ?? "", Impuestos: f.header?.taxes ?? "", "Total detectado": detected ?? "", "Total calculado": calculated, Diferencia: difference, Estado: typeof difference === "number" && Math.abs(difference) > input.tolerance ? "Revisión requerida" : f.status }; });
  const totals = XLSX.utils.json_to_sheet(totalsRows); finish(totals, [28, 18, 14, 24, 12, 14, 14, 18, 18, 14, 20]); XLSX.utils.book_append_sheet(wb, totals, input.mode === "analyze" ? "Facturas" : "Totales por factura");
  if (input.mode === "analyze") {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
    XLSX.writeFile(wb, `${input.partial ? "avance" : "reporte"}_auditiq_${stamp}.xlsx`, { cellStyles: true });
    return;
  }
  const reviewRows = [
    ...input.files.filter((f) => ["Error", "Sin texto detectable", "Revisión requerida", "Pendiente"].includes(f.status)).map((f) => ({ Tipo: "Archivo", Origen: f.name, Estado: f.status, Detalle: f.message ?? "" })),
    ...input.lines.filter((r) => r.status === "Revisión requerida").map((r) => ({ Tipo: "Producto", Origen: r.fileName, Estado: r.status, Detalle: `${r.code} ${r.description} — ${r.observation}` })),
    ...input.comparisons.filter((r) => ["Revisión requerida", "No encontrado"].includes(r.status)).map((r) => ({ Tipo: "Comparación", Origen: r.product, Estado: r.status, Detalle: r.observation })),
  ];
  const review = XLSX.utils.json_to_sheet(reviewRows); finish(review, [18, 30, 22, 60]); XLSX.utils.book_append_sheet(wb, review, "Revisión requerida");
  const inventory = XLSX.utils.json_to_sheet(input.inventory?.rows ?? []); finish(inventory, (input.inventory?.headers ?? []).map(() => 20)); XLSX.utils.book_append_sheet(wb, inventory, "Inventario original");
  const processed = XLSX.utils.json_to_sheet(input.files.map((f) => ({ "Nombre de archivo": f.name, Tamaño: f.size, Páginas: f.pages ?? "", Estado: f.status, Mensaje: f.message ?? "", "Fecha de procesamiento": f.processedAt ?? "" })));
  finish(processed, [30, 14, 10, 22, 45, 24]); XLSX.utils.book_append_sheet(wb, processed, "Archivos procesados");
  const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  XLSX.writeFile(wb, `${input.partial ? "avance" : "reporte"}_auditoria_inventario_${stamp}.xlsx`, { cellStyles: true });
}
