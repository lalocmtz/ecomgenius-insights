import {
  readSheet,
  findHeaderRow,
  parseDate,
  toNumber,
  toPercent,
  toInt,
} from "./utils";

interface OverviewRow {
  date: string;
  gmv: number;
  refunds: number;
  gmv_with_cofunding: number;
  items_sold: number;
  unique_customers: number;
  page_views: number;
  store_visits: number;
  sku_orders: number;
  orders: number;
  conversion_rate: number;
}

/**
 * Parse Overview_My Business Performance XLSX.
 *
 * Structure:
 *   Row 0: Summary headers (Spanish)
 *   Row 1: Summary values
 *   Row 2: empty
 *   Row 3: ["Datos diarios"]
 *   Row 4: Daily headers: Fecha, GMV, Reembolsos, ...
 *   Row 5+: Daily data
 */
export function parseOverview(buffer: Buffer): OverviewRow[] {
  const raw = readSheet(buffer);

  // Find the daily header row by looking for "Fecha"
  const dailyHeaderIdx = findHeaderRow(raw, (v) => v === "fecha");

  if (dailyHeaderIdx === -1) {
    throw new Error(
      "Could not find daily data header row (Fecha) in overview file"
    );
  }

  const dataRows = raw.slice(dailyHeaderIdx + 1);
  const results: OverviewRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const dateStr = parseDate(row[0]);
    if (!dateStr) continue;

    results.push({
      date: dateStr,
      gmv: toNumber(row[1]),
      refunds: toNumber(row[2]),
      gmv_with_cofunding: toNumber(row[3]),
      items_sold: toInt(row[4]),
      unique_customers: toInt(row[5]),
      page_views: toInt(row[6]),
      store_visits: toInt(row[7]),
      sku_orders: toInt(row[8]),
      orders: toInt(row[9]),
      conversion_rate: toPercent(row[10]),
    });
  }

  return results;
}
