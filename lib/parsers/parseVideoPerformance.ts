import {
  readSheet,
  parseDate,
  toNumber,
  toInt,
} from "./utils";

interface VideoPerformanceRow {
  date: string;
  gmv_video: number;
  video_views: number;
  gpm: number;
  sku_orders: number;
  unique_customers: number;
  product_viewers: number;
  product_impressions: number;
}

/**
 * Parse Video Performance Core Stats XLSX.
 *
 * Structure:
 *   Row 0: ["[Rango de fechas]: 2026-03-01 ~ 2026-04-10\n"]
 *   Row 1: empty
 *   Row 2: Headers: Hora, Valor bruto (video) (MX$), VV, GPM (MX$), ...
 *   Row 3+: Data. "Hora" is a date string. Values are plain numbers.
 */
export function parseVideoPerformance(buffer: Buffer): VideoPerformanceRow[] {
  const raw = readSheet(buffer);

  // Headers at row 2
  const headers = raw[2];
  if (!headers) throw new Error("Could not find headers at row index 2 in video performance file");

  const dataRows = raw.slice(3);
  const results: VideoPerformanceRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const dateStr = parseDate(row[0]);
    if (!dateStr) continue;

    results.push({
      date: dateStr,
      gmv_video: toNumber(row[1]),
      video_views: toInt(row[2]),
      gpm: toNumber(row[3]),
      sku_orders: toInt(row[4]),
      unique_customers: toInt(row[5]),
      product_viewers: toInt(row[6]),
      product_impressions: toInt(row[7]),
    });
  }

  return results;
}
