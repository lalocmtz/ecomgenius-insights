import * as XLSX from "xlsx";
import { extractDateRange, toNumber, toStr } from "./utils";

interface ProductCampaignRow {
  campaign_id: string;
  campaign_name: string;
  cost: number;
  roi_protection: string;
  net_cost: number;
  current_budget: number;
  sku_orders: number;
  cost_per_order: number;
  gross_revenue: number;
  roi: number;
  currency: string;
  period_start: string;
  period_end: string;
}

export function parseProductCampaigns(buffer: Buffer): ProductCampaignRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Clean headers - sheet_to_json works directly
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dateRange = extractDateRange(raw);

  const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
  const results: ProductCampaignRow[] = [];

  for (const row of jsonRows) {
    const keys = Object.keys(row);
    if (!keys.length) continue;

    // Try to find campaign ID column
    const campaignId =
      toStr(row["Campaign ID"] ?? row["campaign_id"] ?? row[keys[0]]);
    if (!campaignId || campaignId.toLowerCase().includes("campaign id"))
      continue;

    results.push({
      campaign_id: campaignId,
      campaign_name: toStr(
        row["Campaign name"] ?? row["campaign_name"] ?? row[keys[1]] ?? ""
      ),
      cost: toNumber(row["Cost"] ?? row["cost"] ?? row[keys[2]]),
      roi_protection: toStr(
        row["ROI protection"] ?? row["roi_protection"] ?? row[keys[3]] ?? ""
      ),
      net_cost: toNumber(row["Net cost"] ?? row["net_cost"] ?? row[keys[4]]),
      current_budget: toNumber(
        row["Current budget"] ?? row["current_budget"] ?? row[keys[5]]
      ),
      sku_orders: toNumber(
        row["SKU orders"] ?? row["sku_orders"] ?? row[keys[6]]
      ),
      cost_per_order: toNumber(
        row["Cost per order"] ?? row["cost_per_order"] ?? row[keys[7]]
      ),
      gross_revenue: toNumber(
        row["Gross revenue"] ?? row["gross_revenue"] ?? row[keys[8]]
      ),
      roi: toNumber(row["ROI"] ?? row["roi"] ?? row[keys[9]]),
      currency: toStr(row["Currency"] ?? row["currency"] ?? row[keys[10]] ?? "MXN"),
      period_start: dateRange?.periodStart ?? "",
      period_end: dateRange?.periodEnd ?? "",
    });
  }

  return results;
}
