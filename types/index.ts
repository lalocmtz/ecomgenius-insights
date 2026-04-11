export interface Brand {
  id: string;
  name: string;
  slug: string;
  color: string;
  commission_tiktok: number;
  commission_affiliates: number;
  product_cost_pct: number;
  iva_ads_pct: number;
  retention_pct: number;
  created_at: string;
}

export interface DailyOverview {
  id: string;
  brand_id: string;
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
  uploaded_at: string;
}

export interface Product {
  id: string;
  brand_id: string;
  sku_id: string;
  name: string;
  status: string;
  gmv: number;
  items_sold: number;
  orders: number;
  gmv_store_tab: number;
  items_sold_store_tab: number;
  period_start: string;
  period_end: string;
  uploaded_at: string;
}

export interface VideoPerformance {
  id: string;
  brand_id: string;
  date: string;
  gmv_video: number;
  video_views: number;
  gpm: number;
  sku_orders: number;
  unique_customers: number;
  product_viewers: number;
  product_impressions: number;
  uploaded_at: string;
}

export interface ProductCampaign {
  id: string;
  brand_id: string;
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
  uploaded_at: string;
}

export interface LiveCampaign {
  id: string;
  brand_id: string;
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
  uploaded_at: string;
}

export interface Creative {
  id: string;
  brand_id: string;
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
  uploaded_at: string;
}

export interface AffiliateMetrics {
  id: string;
  brand_id: string;
  period_start: string;
  period_end: string;
  gmv_affiliates: number;
  affiliate_items_sold: number;
  refunds: number;
  refunded_items: number;
  daily_avg_customers: number;
  aov: number;
  videos: number;
  live_streams: number;
  daily_avg_creators_with_sales: number;
  daily_avg_creators_posting: number;
  samples_sent: number;
  estimated_commission: number;
  uploaded_at: string;
}

export interface Creator {
  id: string;
  brand_id: string;
  creator_name: string;
  gmv: number;
  refunds: number;
  attributed_orders: number;
  attributed_items_sold: number;
  refunded_items: number;
  aov: number;
  daily_avg_products_sold: number;
  videos: number;
  live_streams: number;
  estimated_commission: number;
  samples_sent: number;
  period_start: string;
  period_end: string;
  uploaded_at: string;
}

export interface ProductTraffic {
  id: string;
  brand_id: string;
  date: string;
  views: number;
  unique_visitors: number;
  unique_clicks: number;
  clicks: number;
  add_to_cart_clicks: number;
  users_added_to_cart: number;
  customers: number;
  uploaded_at: string;
}

export interface AIReport {
  id: string;
  brand_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  prompt_used: string;
  report_content: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  brand_id: string;
  name: string;
  role: string;
  role_description: string | null;
  cost_monthly: number;
  cost_type: "salary" | "freelance" | "agency";
  hours_per_week: number | null;
  active: boolean;
  created_at: string;
}

export interface FixedCost {
  id: string;
  brand_id: string;
  name: string;
  category: "software" | "logistics" | "production" | "office" | "other";
  amount_monthly: number;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface MonthlyPL {
  id: string;
  brand_id: string;
  year: number;
  month: number;
  gmv: number;
  refunds: number;
  ad_spend: number;
  product_cost: number;
  tiktok_commission: number;
  tax_retention: number;
  guides_affiliates: number;
  iva_ads: number;
  gross_margin: number;
  total_fixed_costs: number;
  net_profit: number;
  net_margin_pct: number;
  notes: string | null;
  created_at: string;
}

export interface AdvisorContext {
  brandName: string;
  period: string;
  gmv: number;
  refunds: number;
  refundRate: number;
  orders: number;
  aov: number;
  uniqueCustomers: number;
  totalAdSpend: number;
  roasBlended: number;
  gmvMaxSpend: number;
  gmvMaxRoi: number;
  livesSpend: number;
  livesRoi: number;
  productCostPct: number;
  productCost: number;
  affiliatesCost: number;
  ttCommission: number;
  taxRetention: number;
  ivaAds: number;
  grossMargin: number;
  grossMarginPct: number;
  team: TeamMember[];
  fixedCosts: FixedCost[];
  totalTeamCost: number;
  totalOpsCost: number;
  totalFixedCosts: number;
  netProfit: number;
  netMarginPct: number;
  topCreatives: Creative[];
  worstCreatives: Creative[];
  affiliateGmv: number;
  topCreator: string;
  topCreatorGmv: number;
  estimatedCommission: number;
}

export type DatePreset = "1d" | "3d" | "7d" | "30d" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
  preset: DatePreset;
}
