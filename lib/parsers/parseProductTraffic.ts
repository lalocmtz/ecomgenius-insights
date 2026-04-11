import {
  readSheet,
  parseDate,
  toInt,
} from "./utils";

interface ProductTrafficRow {
  date: string;
  views: number;
  unique_visitors: number;
  unique_clicks: number;
  clicks: number;
  add_to_cart_clicks: number;
  users_added_to_cart: number;
  customers: number;
}

/**
 * Parse Product Card Traffic Stats XLSX.
 *
 * Structure:
 *   Row 0: ["[Rango de fechas]: 2026-04-10 ~ 2026-04-10\n"]
 *   Row 1: empty
 *   Row 2: Headers: Hora, Vistas, Espectadores, Clics unicos, Clics, ...
 *   Row 3+: Data. "Hora" is a date string like "2026-04-10".
 */
export function parseProductTraffic(buffer: Buffer): ProductTrafficRow[] {
  const raw = readSheet(buffer);

  // Headers at row 2
  const headers = raw[2];
  if (!headers) {
    throw new Error("Could not find headers at row index 2 in product traffic file");
  }

  const dataRows = raw.slice(3);
  const results: ProductTrafficRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const dateStr = parseDate(row[0]);
    if (!dateStr) continue;

    results.push({
      date: dateStr,
      views: toInt(row[1]),
      unique_visitors: toInt(row[2]),
      unique_clicks: toInt(row[3]),
      clicks: toInt(row[4]),
      add_to_cart_clicks: toInt(row[5]),
      users_added_to_cart: toInt(row[6]),
      customers: toInt(row[7]),
    });
  }

  return results;
}
