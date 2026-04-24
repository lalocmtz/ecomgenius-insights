ALTER TABLE public.lives_analysis 
ADD COLUMN IF NOT EXISTS productos_vendidos integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS costo_unitario_producto numeric DEFAULT 0;