
-- Drop old okrs table
DROP TABLE IF EXISTS public.okrs;

-- Create new objetivos table
CREATE TABLE public.objetivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL CHECK (brand IN ('feel_ink', 'skinglow')),
  periodo TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  responsable TEXT,
  meta_value NUMERIC,
  actual_value NUMERIC,
  unidad TEXT DEFAULT 'MXN',
  semaforo TEXT DEFAULT '🟡' CHECK (semaforo IN ('🟢','🟡','🔴')),
  canal TEXT,
  asana_gid TEXT,
  weekly_feedback JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.objetivos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read objetivos" ON public.objetivos FOR SELECT USING (true);
CREATE POLICY "Public write objetivos" ON public.objetivos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update objetivos" ON public.objetivos FOR UPDATE USING (true);
CREATE POLICY "Public delete objetivos" ON public.objetivos FOR DELETE USING (true);

-- Updated_at trigger
CREATE TRIGGER update_objetivos_updated_at
  BEFORE UPDATE ON public.objetivos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
