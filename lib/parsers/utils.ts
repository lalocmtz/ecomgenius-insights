import * as XLSX from "xlsx";
import { parseMXNValue } from "@/lib/format";

/**
 * Extract period_start and period_end from a TikTok date range row.
 * Handles formats:
 *   - "[Rango de fechas]: 2026-03-01 ~ 2026-04-10"
 *   - "2026-03-01 ~ 2026-04-10"
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
 * Extract period from a filename.
 * Handles: "2026-03-01 - 2026-04-10" or "_20260301-20260410" patterns.
 */
export function extractPeriodFromFilename(
  filename: string
): { periodStart: string; periodEnd: string } | null {
  // "2026-03-01 - 2026-04-10" or "2026-03-01 00 ~ 2026-04-10 23"
  const m1 = filename.match(
    /(\d{4}-\d{2}-\d{2})(?:\s+\d{2})?\s*[-~]\s*(\d{4}-\d{2}-\d{2})/
  );
  if (m1) return { periodStart: m1[1], periodEnd: m1[2] };

  // "_20260301-20260410" or "_20260301_20260410"
  const m2 = filename.match(/(\d{4})(\d{2})(\d{2})[-_](\d{4})(\d{2})(\d{2})/);
  if (m2) {
    return {
      periodStart: `${m2[1]}-${m2[2]}-${m2[3]}`,
      periodEnd: `${m2[4]}-${m2[5]}-${m2[6]}`,
    };
  }

  return null;
}

/**
 * Safely parse a numeric value from XLSX cell.
 * Strips commas, percent signs, and whitespace.
 */
export function toNumber(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[,%\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a value that may have "MX$" prefix (like "MX$177,734.26").
 * Falls back to toNumber for plain numeric values.
 */
export function toMXN(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  return parseMXNValue(String(val));
}

/**
 * Parse integer value. Rounds decimals since TikTok sometimes exports
 * integer fields (like items_sold, live_views) with decimal places.
 */
export function toInt(val: unknown): number {
  return Math.round(toNumber(val));
}

/**
 * Parse a percentage string like "0.26%" into a number (0.26).
 * If the value is already a number, returns it as-is.
 */
export function toPercent(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
  const cleaned = str.replace(/%/g, "").replace(/,/g, "").trim();
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

/**
 * Parse a date value from XLSX. Handles:
 * - Excel serial numbers (like 46078)
 * - Date strings ("2026-03-01")
 * - Returns "YYYY-MM-DD" or empty string if unparseable.
 */
export function parseDate(val: unknown): string {
  if (!val) return "";

  if (typeof val === "number") {
    // Excel serial date
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
    return "";
  }

  const str = toStr(val);
  const m = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }

  return "";
}

/**
 * Read an XLSX buffer and return the first sheet as a 2D array of raw values.
 */
export function readSheet(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

/**
 * Find the row index containing a header that matches the given test.
 */
export function findHeaderRow(
  rows: unknown[][],
  test: (cellValue: string) => boolean
): number {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    for (const cell of row) {
      if (test(toStr(cell).toLowerCase())) return i;
    }
  }
  return -1;
}
