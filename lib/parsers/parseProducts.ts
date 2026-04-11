import {
  readSheet,
  extractDateRange,
  toStr,
  toMXN,
  toInt,
} from "./utils";

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

/**
 * Parse product_list XLSX.
 *
 * Structure:
 *   Row 0: ["2026-03-01 ~ 2026-04-10"] (date range)
 *   Row 1: empty
 *   Row 2: Headers: ID, Producto, Estado, GMV, Articulos vendidos, Pedidos, ...
 *   Row 3+: Data. GMV values have "MX$" prefix like "MX$177,734.26".
 */
export function parseProducts(buffer: Buffer): ProductRow[] {
  const raw = readSheet(buffer);

  const dateRange = extractDateRange(raw);
  const periodStart = dateRange?.periodStart ?? "";
  const periodEnd = dateRange?.periodEnd ?? "";

  // Headers at row 2
  const headers = raw[2];
  if (!headers) throw new Error("Could not find headers at row index 2 in products file");

  const dataRows = raw.slice(3);
  const results: ProductRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    results.push({
      sku_id: toStr(row[0]),
      name: toStr(row[1]),
      status: toStr(row[2]),
      gmv: toMXN(row[3]),
      items_sold: toInt(row[4]),
      orders: toInt(row[5]),
      gmv_store_tab: toMXN(row[6]),
      items_sold_store_tab: toInt(row[7]),
      period_start: periodStart,
      period_end: periodEnd,
    });
  }

  return results;
}
