import {
  readSheet,
  toMXN,
  toInt,
  toNumber,
} from "./utils";

interface AffiliateMetricsRow {
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

/**
 * Parse Transaction_Analysis_Core_Metrics XLSX.
 *
 * Structure:
 *   Row 0: Headers in Spanish, ALL IN ROW 0 (NOT row 2!):
 *     GMV atribuido a afiliados, Ventas de articulos atribuidas a afiliados,
 *     Reembolsos, Articulos reembolsados, Prom. diario de clientes, AOV,
 *     Videos, Transmisiones LIVE, Prom. diario creadores con ventas,
 *     Prom. diario creadores con publicacion, Muestras enviadas, ..., Comision estimada
 *   Row 1: Values with "MX$" prefix or plain numbers.
 *   ONLY 2 rows total (headers + 1 data row). This is a SUMMARY.
 */
export function parseAffiliateMetrics(buffer: Buffer): AffiliateMetricsRow[] {
  const raw = readSheet(buffer);

  // Row 0 is headers, Row 1 is the single data row
  if (raw.length < 2) {
    throw new Error("Affiliate metrics file must have at least 2 rows (header + data)");
  }

  const dataRow = raw[1];
  if (!dataRow || dataRow.every((cell: unknown) => !cell)) {
    throw new Error("No data found in affiliate metrics row 1");
  }

  // Parse the single summary row. Values may have "MX$" prefix.
  const result: AffiliateMetricsRow = {
    gmv_affiliates: toMXN(dataRow[0]),
    affiliate_items_sold: toInt(dataRow[1]),
    refunds: toMXN(dataRow[2]),
    refunded_items: toInt(dataRow[3]),
    daily_avg_customers: toNumber(dataRow[4]),
    aov: toMXN(dataRow[5]),
    videos: toInt(dataRow[6]),
    live_streams: toInt(dataRow[7]),
    daily_avg_creators_with_sales: toNumber(dataRow[8]),
    daily_avg_creators_posting: toNumber(dataRow[9]),
    samples_sent: toInt(dataRow[10]),
    // Comision estimada may be the last column; there could be extra columns
    // between samples_sent and estimated_commission. Find it at the end.
    estimated_commission: toMXN(dataRow[dataRow.length - 1]),
  };

  return [result];
}
