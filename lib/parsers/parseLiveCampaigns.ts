import * as XLSX from "xlsx";
import { extractDateRange, toNumber, toStr } from "./utils";

interface LiveCampaignRow {
  campaign_id: string;
  campaign_name: string;
  cost: number;
  net_cost: number;
  gross_revenue: number;
  roi: number;
  sku_orders: number;
  cost_per_order: number;
  live_views: number;
  cost_per_live_view: number;
  live_views_10s: number;
  avg_live_duration: number;
  live_follows: number;
  current_budget: number;
  currency: string;
  period_start: string;
  period_end: string;
}

export function parseLiveCampaigns(buffer: Buffer): LiveCampaignRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dateRange = extractDateRange(raw);

  // Clean headers - sheet_to_json works directly
  const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
  const results: LiveCampaignRow[] = [];

  for (const row of jsonRows) {
    const keys = Object.keys(row);
    if (!keys.length) continue;

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
      net_cost: toNumber(row["Net cost"] ?? row["net_cost"] ?? row[keys[3]]),
      gross_revenue: toNumber(
        row["Gross revenue"] ?? row["gross_revenue"] ?? row[keys[4]]
      ),
      roi: toNumber(row["ROI"] ?? row["roi"] ?? row[keys[5]]),
      sku_orders: toNumber(
        row["SKU orders"] ?? row["sku_orders"] ?? row[keys[6]]
      ),
      cost_per_order: toNumber(
        row["Cost per order"] ?? row["cost_per_order"] ?? row[keys[7]]
      ),
      live_views: toNumber(
        row["Live views"] ?? row["live_views"] ?? row[keys[8]]
      ),
      cost_per_live_view: toNumber(
        row["Cost per live view"] ?? row["cost_per_live_view"] ?? row[keys[9]]
      ),
      live_views_10s: toNumber(
        row["Live views (10s)"] ?? row["live_views_10s"] ?? row[keys[10]]
      ),
      avg_live_duration: toNumber(
        row["Avg. live duration"] ??
          row["avg_live_duration"] ??
          row[keys[11]]
      ),
      live_follows: toNumber(
        row["Live follows"] ?? row["live_follows"] ?? row[keys[12]]
      ),
      current_budget: toNumber(
        row["Current budget"] ?? row["current_budget"] ?? row[keys[13]]
      ),
      currency: toStr(
        row["Currency"] ?? row["currency"] ?? row[keys[14]] ?? "MXN"
      ),
      period_start: dateRange?.periodStart ?? "",
      period_end: dateRange?.periodEnd ?? "",
    });
  }

  return results;
}
