import * as XLSX from "xlsx";
import { parseMXNValue } from "@/lib/format";
import { extractDateRange, toNumber, toStr } from "./utils";

interface AffiliateMetricsRow {
  period_start: string;
  period_end: string;
  gmv_affiliates: number;
  affiliate_items_sold: number;
  refunds: number;
  refunded_items: number;
  daily_avg_customers: number;
  aov: number;
  videos: number;
  live_streams: number;
  daily_avg_creators_with_sales: number;
  daily_avg_creators_posting: number;
  samples_sent: number;
  estimated_commission: number;
}

export function parseAffiliateMetrics(buffer: Buffer): AffiliateMetricsRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const dateRange = extractDateRange(raw);
  const periodStart = dateRange?.periodStart ?? "";
  const periodEnd = dateRange?.periodEnd ?? "";

  // Header at row index 2
  const headers = raw[2];
  if (!headers) throw new Error("Could not find headers at row index 2");

  const dataRows = raw.slice(3);
  const results: AffiliateMetricsRow[] = [];

  for (const row of dataRows) {
    if (!row || row.every((cell) => !cell)) continue;

    // Values may be formatted as "MX$50,652.70"
    const parse = (val: unknown) => {
      if (typeof val === "number") return val;
      return parseMXNValue(toStr(val));
    };

    results.push({
      period_start: periodStart,
      period_end: periodEnd,
      gmv_affiliates: parse(row[0]),
      affiliate_items_sold: parse(row[1]),
      refunds: parse(row[2]),
      refunded_items: parse(row[3]),
      daily_avg_customers: parse(row[4]),
      aov: parse(row[5]),
      videos: parse(row[6]),
      live_streams: parse(row[7]),
      daily_avg_creators_with_sales: parse(row[8]),
      daily_avg_creators_posting: parse(row[9]),
      samples_sent: parse(row[10]),
      estimated_commission: parse(row[11]),
    });
  }

  return results;
}
