import * as XLSX from "xlsx";
import { toNumber, toStr } from "./utils";

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

export function parseVideoPerformance(buffer: Buffer): VideoPerformanceRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Header at row index 2
  const headers = raw[2];
  if (!headers) throw new Error("Could not find headers at row index 2");

  const dataRows = raw.slice(3);
  const results: VideoPerformanceRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const dateVal = row[0];
    let dateStr: string;

    if (typeof dateVal === "number") {
      const parsed = XLSX.SSF.parse_date_code(dateVal);
      dateStr = `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    } else {
      dateStr = toStr(dateVal);
      const m = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (m) {
        dateStr = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      }
    }

    if (!/\d{4}-\d{2}-\d{2}/.test(dateStr)) continue;

    results.push({
      date: dateStr,
      gmv_video: toNumber(row[1]),
      video_views: toNumber(row[2]),
      gpm: toNumber(row[3]),
      sku_orders: toNumber(row[4]),
      unique_customers: toNumber(row[5]),
      product_viewers: toNumber(row[6]),
      product_impressions: toNumber(row[7]),
    });
  }

  return results;
}
