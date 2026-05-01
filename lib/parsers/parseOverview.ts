import {
  readSheet,
  findHeaderRow,
  parseDate,
  toNumber,
  toPercent,
  toInt,
  toStr,
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
 * Detect whether headers match the new "Shop Analytics / Key metrics" format.
 * New columns: Fecha, GMV, Pedidos, Clientes, Artículos vendidos,
 *   Artículos reembolsados, Pedidos con SKU, Ingresos brutos,
 *   Vistas de página, Visitantes, Tasa de conversión, ..., AOV
 */
function isNewKeyMetricsFormat(headerRow: unknown[]): boolean {
  const joined = headerRow.map((c) => toStr(c).toLowerCase()).join("|");
  return joined.includes("pedidos") && joined.includes("aov");
}

export function parseOverview(buffer: Buffer): OverviewRow[] {
  const raw = readSheet(buffer);

  const dailyHeaderIdx = findHeaderRow(raw, (v) => v === "fecha");

  if (dailyHeaderIdx === -1) {
    throw new Error(
      "Could not find daily data header row (Fecha) in overview file"
    );
  }

  const headerRow = raw[dailyHeaderIdx] || [];
  const isNew = isNewKeyMetricsFormat(headerRow);

  const dataRows = raw.slice(dailyHeaderIdx + 1);
  const results: OverviewRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const dateStr = parseDate(row[0]);
    if (!dateStr) continue;

    if (isNew) {
      // New format column mapping:
      // 0:Fecha 1:GMV 2:Pedidos 3:Clientes 4:Artículos vendidos
      // 5:Artículos reembolsados 6:Pedidos con SKU 7:Ingresos brutos
      // 8:Vistas de página 9:Visitantes 10:Tasa de conversión
      // 11:Impresiones producto 12:Impresiones únicas 13:Clics producto
      // 14:Clics únicos 15:AOV
      results.push({
        date: dateStr,
        gmv: toNumber(row[1]),
        refunds: toNumber(row[5]),
        gmv_with_cofunding: toNumber(row[7]),
        items_sold: toInt(row[4]),
        unique_customers: toInt(row[3]),
        page_views: toInt(row[8]),
        store_visits: toInt(row[9]),
        sku_orders: toInt(row[6]),
        orders: toInt(row[2]),
        conversion_rate: toPercent(row[10]),
      });
    } else {
      // Legacy format: Fecha, GMV, Reembolsos, GMV c/Cofunding, Items Sold, ...
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
  }

  return results;
}
