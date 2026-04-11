import * as XLSX from "xlsx";
import { toNumber, toStr } from "./utils";

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

export function parseProductTraffic(buffer: Buffer): ProductTrafficRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Header at row index 2
  const headers = raw[2];
  if (!headers) throw new Error("Could not find headers at row index 2");

  const dataRows = raw.slice(3);
  const results: ProductTrafficRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const dateVal = row[0];
    let dateStr: string;

    if (typeof dateVal === "number") {
      const parsed = XLSX.SSF.parse_date_code(dateVal);
      dateStr = `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    } else {
      dateStr = toStr(dateVal);
      const m = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (m) {
        dateStr = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      }
    }

    if (!/\d{4}-\d{2}-\d{2}/.test(dateStr)) continue;

    results.push({
      date: dateStr,
      views: toNumber(row[1]),
      unique_visitors: toNumber(row[2]),
      unique_clicks: toNumber(row[3]),
      clicks: toNumber(row[4]),
      add_to_cart_clicks: toNumber(row[5]),
      users_added_to_cart: toNumber(row[6]),
      customers: toNumber(row[7]),
    });
  }

  return results;
}
