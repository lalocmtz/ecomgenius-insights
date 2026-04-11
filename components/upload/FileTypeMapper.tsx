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
    pattern: /^Overview[_ ]My[_ ]Business[_ ]Performance/i,
    type: "overview",
    label: "Overview / Business Performance",
    table: "daily_overview",
  },
  {
    pattern: /^Product[_ ]Card[_ ]Traffic[_ ]Stats/i,
    type: "product_traffic",
    label: "Product Card Traffic",
    table: "product_traffic",
  },
  {
    pattern: /^product[_ ]list/i,
    type: "products",
    label: "Product List",
    table: "products",
  },
  {
    pattern: /^Video[_ ]Performance[_ ](Core[_ ]Stats|List)/i,
    type: "video_performance",
    label: "Video Performance",
    table: "video_performance",
  },
  {
    pattern: /^creative[_ ]data[_ ](for[_ ]product[_ ]campaigns)?/i,
    type: "creatives",
    label: "Creatives (Product Campaigns)",
    table: "creatives",
  },
  {
    pattern: /^Live[_ ]campaign[_ ]data/i,
    type: "live_campaigns",
    label: "Live Campaigns",
    table: "live_campaigns",
  },
  {
    pattern: /^livestream[_ ]data[_ ]for[_ ]live[_ ]campaigns/i,
    type: "live_campaigns",
    label: "Livestream Data (Live Campaigns)",
    table: "live_campaigns",
  },
  {
    pattern: /^Product[_ ]campaign[_ ]data/i,
    type: "product_campaigns",
    label: "Product Campaigns",
    table: "product_campaigns",
  },
  {
    pattern: /^Transaction[_ ]Analysis[_ ]Core[_ ]Metrics/i,
    type: "affiliate_metrics",
    label: "Affiliate Metrics (Transaction Core)",
    table: "affiliate_metrics",
  },
  {
    pattern: /^Transaction[_ ]Analysis[_ ]Creator[_ ]List/i,
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
