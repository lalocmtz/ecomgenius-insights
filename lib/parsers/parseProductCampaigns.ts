import {
  readSheet,
  toNumber,
  toStr,
  toInt,
} from "./utils";

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
}

/**
 * Parse Product campaign data XLSX.
 *
 * Structure:
 *   Row 0: Headers in ENGLISH (clean):
 *     Campaign ID, Campaign name, Cost, ROI protection, Net Cost,
 *     Current budget, SKU orders, Cost per order, Gross revenue, ROI,
 *     Currency, Current optimizations
 *   Row 1+: Data. All values are strings/numbers.
 */
export function parseProductCampaigns(buffer: Buffer): ProductCampaignRow[] {
  const raw = readSheet(buffer);

  // Row 0 is headers, data starts at row 1
  const headers = raw[0];
  if (!headers) throw new Error("Could not find headers in product campaigns file");

  const dataRows = raw.slice(1);
  const results: ProductCampaignRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const campaignId = toStr(row[0]);
    // Skip if it looks like a header row
    if (campaignId.toLowerCase() === "campaign id") continue;

    results.push({
      campaign_id: campaignId,
      campaign_name: toStr(row[1]),
      cost: toNumber(row[2]),
      roi_protection: toStr(row[3]),
      net_cost: toNumber(row[4]),
      current_budget: toNumber(row[5]),
      sku_orders: toInt(row[6]),
      cost_per_order: toNumber(row[7]),
      gross_revenue: toNumber(row[8]),
      roi: toNumber(row[9]),
      currency: toStr(row[10]) || "MXN",
    });
  }

  return results;
}
