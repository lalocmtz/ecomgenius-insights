-- Add product_cost_mode and product_cost_fixed to brands
-- Allows entering product cost as a fixed MXN amount per unit instead of percentage

alter table brands
  add column if not exists product_cost_mode text not null default 'pct',
  add column if not exists product_cost_fixed numeric not null default 0;
