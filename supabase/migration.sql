-- Brand profiles
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  color text default '#f97316',
  commission_tiktok numeric default 8,
  commission_affiliates numeric default 6,
  product_cost_pct numeric default 12,
  iva_ads_pct numeric default 16,
  retention_pct numeric default 9.03,
  created_at timestamptz default now()
);

-- Daily business overview
create table if not exists daily_overview (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  date date not null,
  gmv numeric,
  refunds numeric,
  gmv_with_cofunding numeric,
  items_sold integer,
  unique_customers integer,
  page_views integer,
  store_visits integer,
  sku_orders integer,
  orders integer,
  conversion_rate numeric,
  uploaded_at timestamptz default now(),
  unique(brand_id, date)
);

-- Product performance
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  sku_id text not null,
  name text,
  status text,
  gmv numeric,
  items_sold integer,
  orders integer,
  gmv_store_tab numeric,
  items_sold_store_tab integer,
  period_start date,
  period_end date,
  uploaded_at timestamptz default now()
);

-- Video performance
create table if not exists video_performance (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  date date not null,
  gmv_video numeric,
  video_views bigint,
  gpm numeric,
  sku_orders integer,
  unique_customers integer,
  product_viewers integer,
  product_impressions bigint,
  uploaded_at timestamptz default now(),
  unique(brand_id, date)
);

-- Product campaigns
create table if not exists product_campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  campaign_id text,
  campaign_name text,
  cost numeric,
  roi_protection text,
  net_cost numeric,
  current_budget numeric,
  sku_orders integer,
  cost_per_order numeric,
  gross_revenue numeric,
  roi numeric,
  currency text default 'MXN',
  period_start date,
  period_end date,
  uploaded_at timestamptz default now()
);

-- Live campaigns
create table if not exists live_campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  campaign_id text,
  campaign_name text,
  cost numeric,
  net_cost numeric,
  gross_revenue numeric,
  roi numeric,
  sku_orders integer,
  cost_per_order numeric,
  live_views integer,
  cost_per_live_view numeric,
  live_views_10s integer,
  avg_live_duration numeric,
  live_follows integer,
  current_budget numeric,
  currency text default 'MXN',
  period_start date,
  period_end date,
  uploaded_at timestamptz default now()
);

-- Creative data
create table if not exists creatives (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  campaign_name text,
  campaign_id text,
  product_id text,
  creative_type text,
  video_title text,
  video_id text,
  tiktok_account text,
  time_posted text,
  status text,
  authorization_type text,
  cost numeric,
  sku_orders integer,
  cost_per_order numeric,
  gross_revenue numeric,
  roi numeric,
  impressions bigint,
  clicks integer,
  click_rate numeric,
  ad_conversion_rate numeric,
  view_rate_2s numeric,
  view_rate_6s numeric,
  view_rate_25 numeric,
  view_rate_50 numeric,
  view_rate_75 numeric,
  view_rate_100 numeric,
  currency text default 'MXN',
  period_start date,
  period_end date,
  uploaded_at timestamptz default now()
);

-- Affiliate metrics
create table if not exists affiliate_metrics (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  period_start date,
  period_end date,
  gmv_affiliates numeric,
  affiliate_items_sold integer,
  refunds numeric,
  refunded_items integer,
  daily_avg_customers numeric,
  aov numeric,
  videos integer,
  live_streams integer,
  daily_avg_creators_with_sales numeric,
  daily_avg_creators_posting numeric,
  samples_sent integer,
  estimated_commission numeric,
  uploaded_at timestamptz default now()
);

-- Creator list
create table if not exists creators (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  creator_name text,
  gmv numeric,
  refunds numeric,
  attributed_orders integer,
  attributed_items_sold integer,
  refunded_items integer,
  aov numeric,
  daily_avg_products_sold numeric,
  videos integer,
  live_streams integer,
  estimated_commission numeric,
  samples_sent integer,
  period_start date,
  period_end date,
  uploaded_at timestamptz default now()
);

-- Product card traffic
create table if not exists product_traffic (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  date date not null,
  views bigint,
  unique_visitors integer,
  unique_clicks integer,
  clicks integer,
  add_to_cart_clicks integer,
  users_added_to_cart integer,
  customers integer,
  uploaded_at timestamptz default now(),
  unique(brand_id, date)
);

-- AI analysis reports
create table if not exists ai_reports (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  report_type text,
  period_start date,
  period_end date,
  prompt_used text,
  report_content text,
  created_at timestamptz default now()
);

-- Seed default brands
insert into brands (name, slug, color) values
  ('Feel Ink', 'feel-ink', '#f97316'),
  ('Skinglow', 'skinglow', '#a855f7')
on conflict (slug) do nothing;
