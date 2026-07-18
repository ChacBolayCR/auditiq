export type FileStatus = "Pendiente" | "Procesando" | "Procesado" | "Revisión requerida" | "Sin texto detectable" | "Error";
export type RowStatus = "Válido" | "Revisión requerida";

export interface InvoiceHeader { invoiceNumber: string; date: string; supplier: string; currency: string; subtotal?: number; taxes?: number; discounts?: number; total?: number; }
export interface InvoiceLine { id: string; fileName: string; invoiceNumber: string; date: string; supplier: string; code: string; description: string; quantity?: number; unitPrice?: number; discount?: number; tax?: number; lineTotal?: number; status: RowStatus; observation: string; }
export interface InvoiceFile { id: string; file?: File; name: string; size: number; status: FileStatus; pages?: number; processedAt?: string; message?: string; text?: string; header?: InvoiceHeader; }
export interface InventoryRow { id: string; code: string; description: string; quantity?: number; cost?: number; original: Record<string, unknown>; }
export interface ConsolidatedProduct { key: string; code: string; description: string; normalizedCode: string; normalizedDescription: string; billedQuantity: number; averagePrice: number; minPrice: number; maxPrice: number; billedTotal: number; invoiceCount: number; files: string[]; suppliers: string[]; lines: InvoiceLine[]; }
export type ComparisonStatus = "Coincide" | "Faltante" | "Sobrante" | "No encontrado" | "Solo en inventario" | "Revisión requerida";
export interface ComparisonRow { id: string; code: string; product: string; billedQuantity: number; inventoryQuantity?: number; difference?: number; averagePrice: number; billedTotal: number; status: ComparisonStatus; matchMethod: string; observation: string; }
export interface ProcessingError { fileName: string; message: string; type: string; }
export interface AuditSummary { invoiceCount: number; processedCount: number; errorCount: number; noTextCount: number; extractedProducts: number; consolidatedProducts: number; billedUnits: number; billedTotal: number; matches: number; shortages: number; surpluses: number; notFound: number; reviewRequired: number; }
export interface InventoryWorkbook { name: string; sheetNames: string[]; selectedSheet: string; rows: Record<string, unknown>[]; headers: string[]; sheets?: Record<string, Record<string, unknown>[]>; }
export interface ColumnMapping { code: string; description: string; quantity: string; cost: string; }
