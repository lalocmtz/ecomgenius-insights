# 📋 Instrucciones: Crear Tabla live_sessions en Supabase

## Opción 1: Dashboard Supabase (Recomendado - 1 minuto)

1. **Abre Supabase Dashboard**
   - Ve a: https://app.supabase.com/project/jatcupuyqtepdmfbcckt/sql/new
   - O: Supabase → Tu Proyecto → SQL Editor → New Query

2. **Copia y pega este SQL:**

```sql
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  live_date TEXT,
  gmv NUMERIC DEFAULT 0,
  gasto_ads NUMERIC DEFAULT 0,
  pedidos INTEGER DEFAULT 0,
  duracion_minutos INTEGER,
  creadores JSONB,
  roi NUMERIC,
  margen NUMERIC,
  source TEXT DEFAULT 'seller_center_cowork',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_brand_user UNIQUE(brand_id, user_id, live_date)
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_brand_user ON live_sessions(brand_id, user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_created_at ON live_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_date ON live_sessions(live_date);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON live_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON live_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON live_sessions;

CREATE POLICY "Users can view own sessions" ON live_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own sessions" ON live_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own sessions" ON live_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

COMMENT ON TABLE live_sessions IS 'Histórico de sesiones extraídas del TikTok Seller Center';
COMMENT ON COLUMN live_sessions.gmv IS 'Gross Merchandise Value - ventas brutas';
COMMENT ON COLUMN live_sessions.gasto_ads IS 'Gasto invertido en pauta publicitaria';
COMMENT ON COLUMN live_sessions.roi IS 'Return on Ad Spend (GMV / Ads)';
COMMENT ON COLUMN live_sessions.margen IS 'Margen de ganancia (0.0-1.0)';
COMMENT ON COLUMN live_sessions.source IS 'Fuente de datos: seller_center_cowork, manual_entry, etc';
```

3. **Ejecuta la query**
   - Presiona `Ctrl+Enter` o click en ▶️ "Run"
   - Espera confirmación: `✓ Successfully executed` 

4. **Verifica**
   - Ve a: Supabase → Table Editor
   - Deberías ver tabla `live_sessions` en la lista

---

## ✅ Tabla Creada

Una vez que veas la tabla en Table Editor:
- ✅ Tabla: `live_sessions` 
- ✅ Campos: id, brand_id, user_id, live_date, gmv, gasto_ads, pedidos, roi, margen, creadores, source, created_at, updated_at
- ✅ Índices: 3 índices para búsquedas rápidas
- ✅ RLS: Habilitado - usuarios solo ven sus propios datos
- ✅ Políticas: 3 políticas INSERT, SELECT, UPDATE

---

## Próximos Pasos

Una vez tabla creada, ejecuta:

```bash
# Marcar como completado
npm run test:supabase
# O simplemente, deja que la aplicación la use automáticamente
```

**La aplicación está lista para:**
1. ✅ Extraer datos vía Claude Cowork → guardar a `live_sessions`
2. ✅ Mostrar histórico en Analytics panel
3. ✅ Calcular estadísticas de últimos 60 días
