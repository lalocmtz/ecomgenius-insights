
CREATE TABLE public.hosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, brand)
);

ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read hosts" ON public.hosts FOR SELECT USING (true);
CREATE POLICY "Public insert hosts" ON public.hosts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update hosts" ON public.hosts FOR UPDATE USING (true);
CREATE POLICY "Public delete hosts" ON public.hosts FOR DELETE USING (true);

INSERT INTO public.hosts (name, brand, color) VALUES
  ('DENISSE', 'feel_ink', '#FF6B6B'),
  ('EMILIO', 'feel_ink', '#4ECDC4'),
  ('FER', 'feel_ink', '#45B7D1'),
  ('KARO', 'feel_ink', '#96CEB4');
