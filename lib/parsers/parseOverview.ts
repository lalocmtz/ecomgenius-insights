import * as XLSX from "xlsx";
import { extractDateRange, toNumber, toStr } from "./utils";

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

export function parseOverview(buffer: Buffer): OverviewRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Daily data starts at row index 4 (0-indexed). Row 4 has daily headers.
  // Headers: Fecha, GMV, Reembolsos, GMV con cofinanciacion, Articulos vendidos,
  // Clientes unicos, Vistas de paginas, Visitas tienda, Pedido con SKU, Pedidos, Tasa de conversion
  const dailyHeaderIdx = raw.findIndex((row) => {
    const first = toStr(row?.[0]).toLowerCase();
    return first === "fecha" || first.includes("fecha");
  });

  if (dailyHeaderIdx === -1) {
    throw new Error(
      "Could not find daily data header row (Fecha) in overview file"
    );
  }

  const dataRows = raw.slice(dailyHeaderIdx + 1);
  const results: OverviewRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const dateVal = row[0];
    let dateStr: string;

    if (typeof dateVal === "number") {
      // Excel serial date
      const parsed = XLSX.SSF.parse_date_code(dateVal);
      dateStr = `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    } else {
      dateStr = toStr(dateVal);
      // Try to normalize date format
      const m = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (m) {
        dateStr = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      }
    }

    if (!/\d{4}-\d{2}-\d{2}/.test(dateStr)) continue;

    results.push({
      date: dateStr,
      gmv: toNumber(row[1]),
      refunds: toNumber(row[2]),
      gmv_with_cofunding: toNumber(row[3]),
      items_sold: toNumber(row[4]),
      unique_customers: toNumber(row[5]),
      page_views: toNumber(row[6]),
      store_visits: toNumber(row[7]),
      sku_orders: toNumber(row[8]),
      orders: toNumber(row[9]),
      conversion_rate: toNumber(row[10]),
    });
  }

  return results;
}
