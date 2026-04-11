export type FileType =
  | "overview"
  | "product_traffic"
  | "products"
  | "video_performance"
  | "creatives"
  | "live_campaigns"
  | "product_campaigns"
  | "affiliate_metrics"
  | "creators";

interface FileTypePattern {
  pattern: RegExp;
  type: FileType;
  label: string;
  table: string;
}

export const FILE_TYPE_PATTERNS: FileTypePattern[] = [
  {
    pattern: /^Overview_My_Business_Performance/i,
    type: "overview",
    label: "Overview / Business Performance",
    table: "daily_overview",
  },
  {
    pattern: /^Product_Card_Traffic_Stats/i,
    type: "product_traffic",
    label: "Product Card Traffic",
    table: "product_traffic",
  },
  {
    pattern: /^product_list/i,
    type: "products",
    label: "Product List",
    table: "products",
  },
  {
    pattern: /^Video_Performance_Core_Stats/i,
    type: "video_performance",
    label: "Video Performance",
    table: "video_performance",
  },
  {
    pattern: /^creative_data_for_product_campaigns/i,
    type: "creatives",
    label: "Creatives (Product Campaigns)",
    table: "creatives",
  },
  {
    pattern: /^Live_campaign_data/i,
    type: "live_campaigns",
    label: "Live Campaigns",
    table: "live_campaigns",
  },
  {
    pattern: /^Product_campaign_data/i,
    type: "product_campaigns",
    label: "Product Campaigns",
    table: "product_campaigns",
  },
  {
    pattern: /^Transaction_Analysis_Core_Metrics/i,
    type: "affiliate_metrics",
    label: "Affiliate Metrics (Transaction Core)",
    table: "affiliate_metrics",
  },
  {
    pattern: /^Transaction_Analysis_Creator_List/i,
    type: "creators",
    label: "Creators (Transaction Creator List)",
    table: "creators",
  },
];

export function detectFileType(filename: string): FileTypePattern | null {
  for (const entry of FILE_TYPE_PATTERNS) {
    if (entry.pattern.test(filename)) {
      return entry;
    }
  }
  return null;
}
