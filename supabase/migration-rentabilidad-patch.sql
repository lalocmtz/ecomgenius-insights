-- PATCH para Rentabilidad
-- Las tablas team_members y fixed_costs ya existen pero les faltan columnas.
-- monthly_pl no existe todavia.
-- Corre esto en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/jatcupuyqtepdmfbcckt/sql

-- 1. Agregar columnas faltantes a team_members
alter table team_members add column if not exists role_description text;
alter table team_members add column if not exists cost_type text default 'salary';
alter table team_members add column if not exists hours_per_week numeric;

-- 2. Agregar columna faltante a fixed_costs
alter table fixed_costs add column if not exists notes text;

-- 3. Crear monthly_pl (no existe aun)
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

alter table monthly_pl enable row level security;
create policy "Allow all for service role" on monthly_pl for all using (true);

-- 4. Refrescar el cache de schema de PostgREST
notify pgrst, 'reload schema';
