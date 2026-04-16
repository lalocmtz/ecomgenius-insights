
CREATE TABLE public.live_offer_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  live_id UUID NOT NULL REFERENCES public.lives_analysis(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  comunicacion TEXT NOT NULL DEFAULT '',
  ventas NUMERIC NOT NULL DEFAULT 0,
  pedidos INTEGER NOT NULL DEFAULT 0,
  gasto_ads NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.live_offer_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read live_offer_tests" ON public.live_offer_tests FOR SELECT USING (true);
CREATE POLICY "Public insert live_offer_tests" ON public.live_offer_tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update live_offer_tests" ON public.live_offer_tests FOR UPDATE USING (true);
CREATE POLICY "Public delete live_offer_tests" ON public.live_offer_tests FOR DELETE USING (true);

CREATE INDEX idx_live_offer_tests_live_id ON public.live_offer_tests(live_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_offer_tests;
