export function formatMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function parseMXNValue(raw: string): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;
  const cleaned = String(raw).replace(/MX\$|,|\s/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}
