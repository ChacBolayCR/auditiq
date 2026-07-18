export interface ParsedNumber { value?: number; warning?: string }

export function parseLocaleNumber(input: unknown): ParsedNumber {
  if (typeof input === "number") return Number.isFinite(input) ? { value: input } : { warning: "Valor numérico inválido" };
  if (input === null || input === undefined || input === "") return {};
  let raw = String(input).trim().replace(/[^\d.,+\-\s]/g, "").replace(/\s/g, "");
  if (!raw) return { warning: `No se pudo convertir “${String(input)}”` };
  const comma = raw.lastIndexOf(",");
  const dot = raw.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) raw = comma > dot ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  else if (comma >= 0) {
    const decimals = raw.length - comma - 1;
    raw = decimals === 3 && raw.indexOf(",") === comma ? raw.replace(",", "") : raw.replace(/,/g, ".");
  } else if (dot >= 0) {
    const decimals = raw.length - dot - 1;
    if (decimals === 3 && raw.indexOf(".") === dot) raw = raw.replace(".", "");
  }
  const value = Number(raw);
  return Number.isFinite(value) ? { value } : { warning: `No se pudo convertir “${String(input)}”` };
}
