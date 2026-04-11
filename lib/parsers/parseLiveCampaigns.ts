import {
  readSheet,
  toNumber,
  toStr,
  toInt,
} from "./utils";

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
}

/**
 * Parse Live campaign data OR livestream data for live campaigns XLSX.
 * Both map to the live_campaigns table.
 *
 * Live campaign data structure (Row 0 = headers in English):
 *   Campaign ID, Campaign name, Cost, ROI protection, Net Cost, Gross revenue,
 *   ROI, SKU orders, Cost per order, LIVE views, Gross revenue (dup), Cost per LIVE view,
 *   10-second LIVE views, Cost per 10-second LIVE view, Average LIVE duration (minutes),
 *   LIVE follows, Current budget, Currency, Current optimizations
 *
 * Livestream data structure (Row 0 = headers in English):
 *   LIVE name, Launched time, Status, Campaign name, Campaign ID, Cost, Net Cost,
 *   SKU orders, SKU orders (Current shop), Cost per order (Current shop), Gross revenue,
 *   Gross revenue (Current shop), ROI, LIVE views, Cost per LIVE view, 10-second LIVE views,
 *   Average LIVE duration (minutes), LIVE follows, Currency
 */
export function parseLiveCampaigns(buffer: Buffer): LiveCampaignRow[] {
  const raw = readSheet(buffer);

  // Row 0 is headers for both formats
  const headers = raw[0];
  if (!headers) throw new Error("Could not find headers in live campaigns file");

  // Detect format by checking first header
  const firstHeader = toStr(headers[0]).toLowerCase();
  const isLivestreamFormat = firstHeader.includes("live name");

  const dataRows = raw.slice(1);
  const results: LiveCampaignRow[] = [];

  for (const row of dataRows) {
    if (!row || row.every((cell: unknown) => !cell)) continue;

    if (isLivestreamFormat) {
      // Livestream data format
      const campaignId = toStr(row[4]);
      if (!campaignId || campaignId.toLowerCase() === "campaign id") continue;

      results.push({
        campaign_id: campaignId,
        campaign_name: toStr(row[3]),
        cost: toNumber(row[5]),
        net_cost: toNumber(row[6]),
        gross_revenue: toNumber(row[10]),
        roi: toNumber(row[12]),
        sku_orders: toInt(row[7]),
        cost_per_order: toNumber(row[9]),
        live_views: toInt(row[13]),
        cost_per_live_view: toNumber(row[14]),
        live_views_10s: toInt(row[15]),
        avg_live_duration: toNumber(row[16]),
        live_follows: toInt(row[17]),
        current_budget: 0,
        currency: toStr(row[18]) || "MXN",
      });
    } else {
      // Live campaign data format
      const campaignId = toStr(row[0]);
      if (!campaignId || campaignId.toLowerCase() === "campaign id") continue;

      results.push({
        campaign_id: campaignId,
        campaign_name: toStr(row[1]),
        cost: toNumber(row[2]),
        net_cost: toNumber(row[4]),
        gross_revenue: toNumber(row[5]),
        roi: toNumber(row[6]),
        sku_orders: toInt(row[7]),
        cost_per_order: toNumber(row[8]),
        live_views: toInt(row[9]),
        // row[10] is duplicate "Gross revenue", skip it
        cost_per_live_view: toNumber(row[11]),
        live_views_10s: toInt(row[12]),
        avg_live_duration: toNumber(row[14]),
        live_follows: toInt(row[15]),
        current_budget: toNumber(row[16]),
        currency: toStr(row[17]) || "MXN",
      });
    }
  }

  return results;
}
