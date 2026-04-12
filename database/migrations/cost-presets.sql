-- Tabla de presets de costos predefinidos
-- No influye en los datos, es solo referencia para las simulaciones

CREATE TABLE IF NOT EXISTS predefined_cost_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Costos del preset
  product_cost_mode VARCHAR(10) NOT NULL DEFAULT 'pct', -- 'pct' or 'fixed'
  product_cost_pct DECIMAL(5,2),
  product_cost_fixed DECIMAL(10,2),
  guias_pct DECIMAL(5,2) DEFAULT 6,
  tt_commission_pct DECIMAL(5,2) DEFAULT 8,
  iva_ads_pct DECIMAL(5,2) DEFAULT 16,
  retencion_base_pct DECIMAL(5,2) DEFAULT 10.5,

  -- Opcionales
  costo_host DECIMAL(10,2),
  roas_value DECIMAL(5,2),
  has_ads BOOLEAN DEFAULT true, -- false = live sin pauta

  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_presets_user_brand ON predefined_cost_presets(user_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_presets_is_default ON predefined_cost_presets(brand_id, is_default);

-- Enable RLS
ALTER TABLE predefined_cost_presets ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own presets
CREATE POLICY "Users see own cost presets"
  ON predefined_cost_presets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users create own presets"
  ON predefined_cost_presets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own presets"
  ON predefined_cost_presets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own presets"
  ON predefined_cost_presets FOR DELETE
  USING (user_id = auth.uid());

-- Tabla de logs de simulaciones (opcional, para analytics)
CREATE TABLE IF NOT EXISTS simulation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  simulation_type VARCHAR(20) NOT NULL, -- 'gmv', 'live', 'afiliado'
  preset_id uuid REFERENCES predefined_cost_presets(id) ON DELETE SET NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sim_logs_user_brand ON simulation_logs(user_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_sim_logs_created_at ON simulation_logs(created_at DESC);
