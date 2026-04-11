import * as XLSX from "xlsx";
import { extractDateRange, toNumber, toStr } from "./utils";

interface ProductRow {
  sku_id: string;
  name: string;
  status: string;
  gmv: number;
  items_sold: number;
  orders: number;
  gmv_store_tab: number;
  items_sold_store_tab: number;
  period_start: string;
  period_end: string;
}

export function parseProducts(buffer: Buffer): ProductRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const dateRange = extractDateRange(raw);
  const periodStart = dateRange?.periodStart ?? "";
  const periodEnd = dateRange?.periodEnd ?? "";

  // Header at row index 2 (0-indexed)
  const headers = raw[2];
  if (!headers) throw new Error("Could not find headers at row index 2");

  const dataRows = raw.slice(3);
  const results: ProductRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    results.push({
      sku_id: toStr(row[0]),
      name: toStr(row[1]),
      status: toStr(row[2]),
      gmv: toNumber(row[3]),
      items_sold: toNumber(row[4]),
      orders: toNumber(row[5]),
      gmv_store_tab: toNumber(row[6]),
      items_sold_store_tab: toNumber(row[7]),
      period_start: periodStart,
      period_end: periodEnd,
    });
  }

  return results;
}
