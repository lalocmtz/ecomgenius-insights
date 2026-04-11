import * as XLSX from "xlsx";
import { extractDateRange, toNumber, toStr } from "./utils";

interface CreativeRow {
  campaign_name: string;
  campaign_id: string;
  product_id: string;
  creative_type: string;
  video_title: string;
  video_id: string;
  tiktok_account: string;
  time_posted: string;
  status: string;
  authorization_type: string;
  cost: number;
  sku_orders: number;
  cost_per_order: number;
  gross_revenue: number;
  roi: number;
  impressions: number;
  clicks: number;
  click_rate: number;
  ad_conversion_rate: number;
  view_rate_2s: number;
  view_rate_6s: number;
  view_rate_25: number;
  view_rate_50: number;
  view_rate_75: number;
  view_rate_100: number;
  currency: string;
  period_start: string;
  period_end: string;
}

export function parseCreatives(buffer: Buffer): CreativeRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dateRange = extractDateRange(raw);

  // Clean headers - sheet_to_json works directly
  const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
  const results: CreativeRow[] = [];

  for (const row of jsonRows) {
    const keys = Object.keys(row);
    if (!keys.length) continue;

    const campaignName = toStr(
      row["Campaign name"] ?? row["campaign_name"] ?? row[keys[0]] ?? ""
    );
    if (!campaignName || campaignName.toLowerCase() === "campaign name")
      continue;

    results.push({
      campaign_name: campaignName,
      campaign_id: toStr(
        row["Campaign ID"] ?? row["campaign_id"] ?? row[keys[1]] ?? ""
      ),
      product_id: toStr(
        row["Product ID"] ?? row["product_id"] ?? row[keys[2]] ?? ""
      ),
      creative_type: toStr(
        row["Creative type"] ?? row["creative_type"] ?? row[keys[3]] ?? ""
      ),
      video_title: toStr(
        row["Video title"] ?? row["video_title"] ?? row[keys[4]] ?? ""
      ),
      video_id: toStr(
        row["Video ID"] ?? row["video_id"] ?? row[keys[5]] ?? ""
      ),
      tiktok_account: toStr(
        row["TikTok account"] ?? row["tiktok_account"] ?? row[keys[6]] ?? ""
      ),
      time_posted: toStr(
        row["Time posted"] ?? row["time_posted"] ?? row[keys[7]] ?? ""
      ),
      status: toStr(row["Status"] ?? row["status"] ?? row[keys[8]] ?? ""),
      authorization_type: toStr(
        row["Authorization type"] ??
          row["authorization_type"] ??
          row[keys[9]] ??
          ""
      ),
      cost: toNumber(row["Cost"] ?? row["cost"] ?? row[keys[10]]),
      sku_orders: toNumber(
        row["SKU orders"] ?? row["sku_orders"] ?? row[keys[11]]
      ),
      cost_per_order: toNumber(
        row["Cost per order"] ?? row["cost_per_order"] ?? row[keys[12]]
      ),
      gross_revenue: toNumber(
        row["Gross revenue"] ?? row["gross_revenue"] ?? row[keys[13]]
      ),
      roi: toNumber(row["ROI"] ?? row["roi"] ?? row[keys[14]]),
      impressions: toNumber(
        row["Impressions"] ?? row["impressions"] ?? row[keys[15]]
      ),
      clicks: toNumber(row["Clicks"] ?? row["clicks"] ?? row[keys[16]]),
      click_rate: toNumber(
        row["Click rate"] ?? row["click_rate"] ?? row[keys[17]]
      ),
      ad_conversion_rate: toNumber(
        row["Ad conversion rate"] ??
          row["ad_conversion_rate"] ??
          row[keys[18]]
      ),
      view_rate_2s: toNumber(
        row["2-second view rate"] ?? row["view_rate_2s"] ?? row[keys[19]]
      ),
      view_rate_6s: toNumber(
        row["6-second view rate"] ?? row["view_rate_6s"] ?? row[keys[20]]
      ),
      view_rate_25: toNumber(
        row["25% view rate"] ?? row["view_rate_25"] ?? row[keys[21]]
      ),
      view_rate_50: toNumber(
        row["50% view rate"] ?? row["view_rate_50"] ?? row[keys[22]]
      ),
      view_rate_75: toNumber(
        row["75% view rate"] ?? row["view_rate_75"] ?? row[keys[23]]
      ),
      view_rate_100: toNumber(
        row["100% view rate"] ?? row["view_rate_100"] ?? row[keys[24]]
      ),
      currency: toStr(
        row["Currency"] ?? row["currency"] ?? row[keys[25]] ?? "MXN"
      ),
      period_start: dateRange?.periodStart ?? "",
      period_end: dateRange?.periodEnd ?? "",
    });
  }

  return results;
}
