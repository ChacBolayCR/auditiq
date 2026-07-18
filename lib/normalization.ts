export function normalizeCode(value: unknown): string {
  return String(value ?? "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim().toUpperCase();
}

export function normalizeDescription(value: unknown): string {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)\s*(kilogramos?|kgs?\.?)/g, "$1 kg").replace(/(\d)\s*(gramos?|grs?\.?)/g, "$1 g")
    .replace(/(\d)\s*(litros?|lts?\.?)/g, "$1 l").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
