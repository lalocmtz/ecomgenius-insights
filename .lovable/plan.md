

# Plan: Rediseño Dashboard con daily_metrics

## Resumen
Crear un hook `useDashboardData` que lea `daily_metrics` y `kpis_monthly` del mes actual, y reescribir `Dashboard.tsx` con 4 secciones nuevas. Insertar datos seed de KPIs ABR-2025 y daily_metrics de ejemplo (1-3 abril).

## Archivos a crear/modificar

### 1. Crear `src/hooks/useDashboardData.ts`
- 2 queries React Query (staleTime 30s):
  - `daily_metrics` filtrado por `activeBrand` + mes actual (día 1 → hoy)
  - `kpis_monthly` filtrado por `activeBrand` + periodo actual (ej: "ABR-2026")
- Calcula internamente: ventasNetas, costos (suma de todos los campos de costo), utilidad, margen
- Retorna `{ metrics, kpis, isLoading }`
- El periodo se genera dinámicamente con mes en español abreviado uppercase + año

### 2. Reescribir `src/pages/Dashboard.tsx`
Reemplazar todo el contenido actual. 4 secciones:

**Sección 1 — Hero Utilidad MTD**: Card full-width con utilidad total del mes, color por margen (verde >=20, amarillo >=14, rojo <14), grid 4 cols (Ventas Brutas, Gasto Ads, Costos Op, Utilidad), barra progreso meta 20%.

**Sección 2 — Tabla Objetivos por Canal**: Lee kpis con slugs `ventas_meta`, `ventas_tiktok_ads`, etc. Mapea cada slug a un canal en daily_metrics para calcular Actual MTD. Columnas: Canal, Meta Mes, Actual MTD, % Avance, Semáforo (w-2 h-2 rounded-full), Tendencia (↑↓→). Fila TOTAL. Resumen semáforos.

**Sección 3 — Gráficas (lg:grid-cols-5)**: LineChart ventas vs utilidad por día con tabs 7D/30D/MTD. PieChart donut mix por canal con top 5, total al centro.

**Sección 4 — Top Canales Hoy + Alertas (lg:grid-cols-2)**: 3 mini cards de canales con más ventas del último día. Lista de hasta 5 alertas automáticas (margen crítico, canales cayendo, canales excepcionales).

### 3. Migración SQL — Seed kpis_monthly ABR-2025
Insertar vía migration tool:
- Feel Ink: ventas_meta $450K, ventas_tiktok_ads $120K, ventas_gmv $250K, ventas_lives $160K, ventas_ml $100K, ventas_google $60K, ventas_email $20K, margen 20%
- Skinglow: ventas_meta $600K, ventas_gmv $120K, ventas_lives 20, ventas_ml $80K, ventas_google $60K, ventas_email $30K, margen 20%
- Con `ON CONFLICT DO NOTHING` para idempotencia (unique on brand+periodo+kpi_slug)

### 4. Insert daily_metrics — 3 días ejemplo abril
Insertar vía insert tool 3 días (1-3 abril) para ambas marcas con 7 canales cada uno. Cantidades realistas proporcionales a los targets mensuales.

## Notas técnicas
- El mapeo kpi_slug → canal: `ventas_meta` → `Meta`, `ventas_tiktok_ads` → `TikTok Ads`, `ventas_gmv` → `GMV MAX`, `ventas_lives` → `Lives`, `ventas_ml` → `Mercado Libre`, `ventas_google` → `Google`, `ventas_email` → `Email`
- Tendencia: compara sum(ventas_brutas) últimos 7 días vs 7 previos del mismo canal. >5% = ↑, <-5% = ↓, else →
- No se modifica ningún otro archivo
- Si no hay datos: muestra "$0" y "Sin datos"

