import {
  readSheet,
  toStr,
  toMXN,
  toInt,
  toNumber,
} from "./utils";

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
}

/**
 * Parse Transaction_Analysis_Creator_List XLSX.
 *
 * Structure:
 *   Row 0: Headers in Spanish, ALL IN ROW 0 (NOT row 2!):
 *     Creator name, GMV atribuido a afiliados, Reembolsos,
 *     Pedidos atribuidos, Ventas de articulos atribuidas a afiliados,
 *     Articulos reembolsados, AOV, Prom. diario productos vendidos,
 *     Videos, Transmisiones LIVE, Comision estimada, Muestras enviadas
 *   Row 1+: Data. Values with "MX$" prefix.
 */
export function parseCreatorList(buffer: Buffer): CreatorRow[] {
  const raw = readSheet(buffer);

  // Row 0 is headers, data starts at row 1
  const headers = raw[0];
  if (!headers) throw new Error("Could not find headers in creator list file");

  const dataRows = raw.slice(1);
  const results: CreatorRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const creatorName = toStr(row[0]);
    if (!creatorName) continue;
    // Skip if it looks like a header row
    if (creatorName.toLowerCase() === "creator name") continue;

    results.push({
      creator_name: creatorName,
      gmv: toMXN(row[1]),
      refunds: toMXN(row[2]),
      attributed_orders: toInt(row[3]),
      attributed_items_sold: toInt(row[4]),
      refunded_items: toInt(row[5]),
      aov: toMXN(row[6]),
      daily_avg_products_sold: toNumber(row[7]),
      videos: toInt(row[8]),
      live_streams: toInt(row[9]),
      estimated_commission: toMXN(row[10]),
      samples_sent: toInt(row[11]),
    });
  }

  return results;
}
