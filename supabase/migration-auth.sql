-- Auth + RLS por brand
-- Corre esto en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/jatcupuyqtepdmfbcckt/sql

-- 1. Tabla de acceso usuario -> brand
create table if not exists user_brands (
  user_id uuid references auth.users(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  is_admin boolean default false,
  created_at timestamptz default now(),
  primary key (user_id, brand_id)
);

alter table user_brands enable row level security;

-- Cada usuario puede ver solo sus accesos
drop policy if exists "Users see own brand access" on user_brands;
create policy "Users see own brand access"
  on user_brands for select
  using (auth.uid() = user_id);

-- 2. Helper function: marca tiene acceso?
create or replace function user_has_brand_access(target_brand uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_brands
    where user_id = auth.uid() and brand_id = target_brand
  );
$$;

-- 3. Activar RLS en tabla brands y filtrar por acceso
alter table brands enable row level security;

drop policy if exists "Allow all for service role" on brands;
drop policy if exists "Users see allowed brands" on brands;
create policy "Users see allowed brands"
  on brands for select
  using (user_has_brand_access(id));

-- 4. RLS en tablas dependientes (filtrar por brand_id)
-- Nota: aplicar el mismo patron a todas las tablas con brand_id

do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'daily_overview',
      'products',
      'video_performance',
      'product_campaigns',
      'live_campaigns',
      'creatives',
      'affiliate_metrics',
      'creators',
      'product_traffic',
      'ai_reports',
      'team_members',
      'fixed_costs',
      'monthly_pl'
    ])
  loop
    -- Activar RLS si no esta activa
    execute format('alter table %I enable row level security', tbl);
    -- Borrar policy vieja si existe
    execute format('drop policy if exists "Allow all for service role" on %I', tbl);
    execute format('drop policy if exists "Users see allowed brand data" on %I', tbl);
    -- Crear policy nueva: solo brands autorizadas
    execute format(
      'create policy "Users see allowed brand data" on %I for all using (user_has_brand_access(brand_id))',
      tbl
    );
  end loop;
end $$;

-- 5. Refrescar cache de schema
notify pgrst, 'reload schema';

-- 6. PASOS MANUALES (luego de correr este SQL):
-- a) En Authentication > Users, crea tu usuario admin y los usuarios cliente
-- b) Para cada usuario corre:
--    insert into user_brands (user_id, brand_id, is_admin) values
--      ('USER_UUID_AQUI', (select id from brands where slug = 'feel-ink'), true);
-- c) El admin debe tener un row por cada brand que pueda ver
