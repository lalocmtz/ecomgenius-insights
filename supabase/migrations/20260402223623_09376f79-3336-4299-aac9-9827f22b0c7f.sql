
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ─── daily_metrics ───
CREATE TABLE public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL CHECK (brand IN ('feel_ink', 'skinglow')),
  date DATE NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('tiktok', 'shopify', 'meta', 'mayoreo', 'organico')),
  ventas_brutas NUMERIC(12,2) DEFAULT 0,
  pedidos INTEGER DEFAULT 0,
  descuentos NUMERIC(12,2) DEFAULT 0,
  devoluciones NUMERIC(12,2) DEFAULT 0,
  cogs NUMERIC(12,2) DEFAULT 0,
  guias NUMERIC(12,2) DEFAULT 0,
  comision_tts NUMERIC(12,2) DEFAULT 0,
  iva_ads NUMERIC(12,2) DEFAULT 0,
  retenciones NUMERIC(12,2) DEFAULT 0,
  anuncios NUMERIC(12,2) DEFAULT 0,
  costo_host NUMERIC(12,2) DEFAULT 0,
  nomina NUMERIC(12,2) DEFAULT 0,
  gastos_fijos NUMERIC(12,2) DEFAULT 0,
  source TEXT,
  edited_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand, date, canal)
);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read daily_metrics" ON public.daily_metrics FOR SELECT USING (true);
CREATE POLICY "Public write daily_metrics" ON public.daily_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update daily_metrics" ON public.daily_metrics FOR UPDATE USING (true);
CREATE POLICY "Public delete daily_metrics" ON public.daily_metrics FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_metrics;
CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON public.daily_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── lives_analysis ───
CREATE TABLE public.lives_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT DEFAULT 'feel_ink',
  fecha DATE NOT NULL,
  hora TIME,
  duracion TEXT,
  host TEXT,
  pedidos INTEGER DEFAULT 0,
  tatuajes INTEGER DEFAULT 0,
  aov NUMERIC(10,2) DEFAULT 0,
  roas_live NUMERIC(6,2) DEFAULT 0,
  venta NUMERIC(12,2) DEFAULT 0,
  ads NUMERIC(12,2) DEFAULT 0,
  mercancias NUMERIC(12,2) DEFAULT 0,
  costo_host NUMERIC(12,2) DEFAULT 0,
  dalilo NUMERIC(12,2) DEFAULT 0,
  iva_ads NUMERIC(12,2) DEFAULT 0,
  envio_comision_tt NUMERIC(12,2) DEFAULT 0,
  impuestos NUMERIC(12,2) DEFAULT 0,
  gasto_total NUMERIC(12,2) DEFAULT 0,
  utilidad NUMERIC(12,2) DEFAULT 0,
  margen NUMERIC(6,4) DEFAULT 0,
  roi NUMERIC(6,2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lives_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read lives_analysis" ON public.lives_analysis FOR SELECT USING (true);
CREATE POLICY "Public write lives_analysis" ON public.lives_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update lives_analysis" ON public.lives_analysis FOR UPDATE USING (true);
CREATE POLICY "Public delete lives_analysis" ON public.lives_analysis FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.lives_analysis;
CREATE TRIGGER update_lives_analysis_updated_at BEFORE UPDATE ON public.lives_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── creativos ───
CREATE TABLE public.creativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL CHECK (brand IN ('feel_ink', 'skinglow')),
  nombre TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('video', 'imagen', 'ugc', 'live_clip')),
  plataforma TEXT CHECK (plataforma IN ('meta', 'tiktok_ads', 'tiktok_organico', 'instagram')),
  estado TEXT DEFAULT 'activo',
  spend NUMERIC(12,2) DEFAULT 0,
  impresiones INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversiones INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  ctr NUMERIC(6,4) DEFAULT 0,
  cpc NUMERIC(10,2) DEFAULT 0,
  cpa NUMERIC(10,2) DEFAULT 0,
  roas NUMERIC(6,2) DEFAULT 0,
  hook_text TEXT,
  angulo TEXT,
  formato TEXT,
  duracion_seg INTEGER,
  creador TEXT,
  fecha_lanzamiento DATE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read creativos" ON public.creativos FOR SELECT USING (true);
CREATE POLICY "Public write creativos" ON public.creativos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update creativos" ON public.creativos FOR UPDATE USING (true);
CREATE POLICY "Public delete creativos" ON public.creativos FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.creativos;
CREATE TRIGGER update_creativos_updated_at BEFORE UPDATE ON public.creativos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── organico_posts ───
CREATE TABLE public.organico_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL CHECK (brand IN ('feel_ink', 'skinglow')),
  plataforma TEXT NOT NULL,
  fecha_publicacion TIMESTAMPTZ,
  tipo TEXT,
  caption TEXT,
  hashtags TEXT[],
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comentarios INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  es_viral BOOLEAN DEFAULT false,
  angulo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organico_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read organico_posts" ON public.organico_posts FOR SELECT USING (true);
CREATE POLICY "Public write organico_posts" ON public.organico_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update organico_posts" ON public.organico_posts FOR UPDATE USING (true);
CREATE POLICY "Public delete organico_posts" ON public.organico_posts FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.organico_posts;
CREATE TRIGGER update_organico_posts_updated_at BEFORE UPDATE ON public.organico_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── kpis_monthly ───
CREATE TABLE public.kpis_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  periodo TEXT NOT NULL,
  kpi_slug TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  clasificacion TEXT,
  valor_actual NUMERIC(14,4),
  valor_target NUMERIC(14,4),
  unidad TEXT DEFAULT '%',
  status TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand, periodo, kpi_slug)
);

ALTER TABLE public.kpis_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read kpis_monthly" ON public.kpis_monthly FOR SELECT USING (true);
CREATE POLICY "Public write kpis_monthly" ON public.kpis_monthly FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update kpis_monthly" ON public.kpis_monthly FOR UPDATE USING (true);
CREATE POLICY "Public delete kpis_monthly" ON public.kpis_monthly FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.kpis_monthly;
CREATE TRIGGER update_kpis_monthly_updated_at BEFORE UPDATE ON public.kpis_monthly FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── okrs ───
CREATE TABLE public.okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  periodo TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  status TEXT DEFAULT 'en_camino' CHECK (status IN ('en_camino', 'en_riesgo', 'logrado', 'no_iniciado')),
  kr_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read okrs" ON public.okrs FOR SELECT USING (true);
CREATE POLICY "Public write okrs" ON public.okrs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update okrs" ON public.okrs FOR UPDATE USING (true);
CREATE POLICY "Public delete okrs" ON public.okrs FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.okrs;
CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON public.okrs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── margin_scenarios ───
CREATE TABLE public.margin_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  nombre TEXT NOT NULL,
  aov NUMERIC(10,2),
  roas_objetivo NUMERIC(6,2),
  costo_host NUMERIC(10,2),
  margen_estimado NUMERIC(6,4),
  cpa_proyectado NUMERIC(10,2),
  profit_unitario NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.margin_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read margin_scenarios" ON public.margin_scenarios FOR SELECT USING (true);
CREATE POLICY "Public write margin_scenarios" ON public.margin_scenarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update margin_scenarios" ON public.margin_scenarios FOR UPDATE USING (true);
CREATE POLICY "Public delete margin_scenarios" ON public.margin_scenarios FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.margin_scenarios;

-- ─── agent_conversations ───
CREATE TABLE public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  last_analysis TEXT,
  last_analysis_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read agent_conversations" ON public.agent_conversations FOR SELECT USING (true);
CREATE POLICY "Public write agent_conversations" ON public.agent_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update agent_conversations" ON public.agent_conversations FOR UPDATE USING (true);
CREATE POLICY "Public delete agent_conversations" ON public.agent_conversations FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_conversations;
CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON public.agent_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── agent_daily_runs (for Paso 6) ───
CREATE TABLE public.agent_daily_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
  result TEXT,
  error_message TEXT,
  ran_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_daily_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read agent_daily_runs" ON public.agent_daily_runs FOR SELECT USING (true);
CREATE POLICY "Public write agent_daily_runs" ON public.agent_daily_runs FOR INSERT WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_daily_runs;
