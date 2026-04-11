import * as XLSX from "xlsx";
import { parseMXNValue } from "@/lib/format";
import { extractDateRange, toNumber, toStr } from "./utils";

interface CreatorRow {
  creator_name: string;
  gmv: number;
  refunds: number;
  attributed_orders: number;
  attributed_items_sold: number;
  refunded_items: number;
  aov: number;
  daily_avg_products_sold: number;
  videos: number;
  live_streams: number;
  estimated_commission: number;
  samples_sent: number;
  period_start: string;
  period_end: string;
}

export function parseCreatorList(buffer: Buffer): CreatorRow[] {
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
  const results: CreatorRow[] = [];

  const parse = (val: unknown) => {
    if (typeof val === "number") return val;
    return parseMXNValue(toStr(val));
  };

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const creatorName = toStr(row[0]);
    if (!creatorName) continue;

    results.push({
      creator_name: creatorName,
      gmv: parse(row[1]),
      refunds: parse(row[2]),
      attributed_orders: parse(row[3]),
      attributed_items_sold: parse(row[4]),
      refunded_items: parse(row[5]),
      aov: parse(row[6]),
      daily_avg_products_sold: parse(row[7]),
      videos: parse(row[8]),
      live_streams: parse(row[9]),
      estimated_commission: parse(row[10]),
      samples_sent: parse(row[11]),
      period_start: periodStart,
      period_end: periodEnd,
    });
  }

  return results;
}
