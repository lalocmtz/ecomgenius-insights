import {
  readSheet,
  toNumber,
  toStr,
  toInt,
  toPercent,
} from "./utils";

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
}

/**
 * Parse creative data for product campaigns XLSX.
 *
 * Structure:
 *   Row 0: Headers in ENGLISH (clean, no skipped rows):
 *     Campaign name, Campaign ID, Product ID, Creative type, Video title,
 *     Video ID, TikTok account, Time posted, Status, Authorization type,
 *     Cost, SKU orders, Cost per order, Gross revenue, ROI, Impressions,
 *     Clicks, Click rate, Ad conversion rate, 2s view rate, 6s view rate,
 *     25% viewed, 50% viewed, 75% viewed, 100% viewed, Currency
 *   Row 1+: Data directly. Values are plain numbers. No MX$ prefix.
 */
export function parseCreatives(buffer: Buffer): CreativeRow[] {
  const raw = readSheet(buffer);

  // Row 0 is headers, data starts at row 1
  const headers = raw[0];
  if (!headers) throw new Error("Could not find headers in creatives file");

  const dataRows = raw.slice(1);
  const results: CreativeRow[] = [];

  for (const row of dataRows) {
    if (!row || !row[0]) continue;

    const campaignName = toStr(row[0]);
    // Skip if it looks like a header row
    if (campaignName.toLowerCase() === "campaign name") continue;

    results.push({
      campaign_name: campaignName,
      campaign_id: toStr(row[1]),
      product_id: toStr(row[2]),
      creative_type: toStr(row[3]),
      video_title: toStr(row[4]),
      video_id: toStr(row[5]),
      tiktok_account: toStr(row[6]),
      time_posted: toStr(row[7]),
      status: toStr(row[8]),
      authorization_type: toStr(row[9]),
      cost: toNumber(row[10]),
      sku_orders: toInt(row[11]),
      cost_per_order: toNumber(row[12]),
      gross_revenue: toNumber(row[13]),
      roi: toNumber(row[14]),
      impressions: toInt(row[15]),
      clicks: toInt(row[16]),
      click_rate: toPercent(row[17]),
      ad_conversion_rate: toPercent(row[18]),
      view_rate_2s: toPercent(row[19]),
      view_rate_6s: toPercent(row[20]),
      view_rate_25: toPercent(row[21]),
      view_rate_50: toPercent(row[22]),
      view_rate_75: toPercent(row[23]),
      view_rate_100: toPercent(row[24]),
      currency: toStr(row[25]) || "MXN",
    });
  }

  return results;
}
