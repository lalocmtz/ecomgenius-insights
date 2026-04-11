/**
 * Extract period_start and period_end from a TikTok date range row.
 * Row 0 often looks like: "[Rango de fechas]: 2026-03-01 ~ 2026-04-10"
 */
export function extractDateRange(
  rows: unknown[][]
): { periodStart: string; periodEnd: string } | null {
  if (!rows.length) return null;

  const firstRow = rows[0];
  if (!firstRow) return null;

  for (const cell of firstRow) {
    const str = String(cell ?? "");
    const match = str.match(/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return { periodStart: match[1], periodEnd: match[2] };
    }
  }
  return null;
}

/**
 * Safely parse a numeric value from XLSX cell.
 */
export function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[,%]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Safely convert cell to string.
 */
export function toStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}
