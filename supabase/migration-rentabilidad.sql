-- Migration: Rentabilidad module tables
-- Run this in the Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/jatcupuyqtepdmfbcckt/sql

-- Team members / payroll
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  role text not null,
  role_description text,
  cost_monthly numeric not null,
  cost_type text default 'salary',
  hours_per_week numeric,
  active boolean default true,
  created_at timestamptz default now()
);

-- Fixed / operational costs
create table if not exists fixed_costs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  category text not null,
  amount_monthly numeric not null,
  notes text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Monthly P&L snapshots (computed + saved)
create table if not exists monthly_pl (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  year integer not null,
  month integer not null,
  gmv numeric,
  refunds numeric,
  ad_spend numeric,
  product_cost numeric,
  tiktok_commission numeric,
  tax_retention numeric,
  guides_affiliates numeric,
  iva_ads numeric,
  gross_margin numeric,
  total_fixed_costs numeric,
  net_profit numeric,
  net_margin_pct numeric,
  notes text,
  created_at timestamptz default now(),
  unique(brand_id, year, month)
);

-- Enable RLS (optional, adjust as needed)
alter table team_members enable row level security;
alter table fixed_costs enable row level security;
alter table monthly_pl enable row level security;

-- Allow all operations for service role (anon key needs separate policies)
create policy "Allow all for service role" on team_members for all using (true);
create policy "Allow all for service role" on fixed_costs for all using (true);
create policy "Allow all for service role" on monthly_pl for all using (true);
