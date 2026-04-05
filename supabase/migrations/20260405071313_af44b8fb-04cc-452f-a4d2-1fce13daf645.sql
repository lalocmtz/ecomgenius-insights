
-- Drop existing canal constraint
ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_canal_check;

-- Update legacy values before adding new constraint
UPDATE public.daily_metrics SET canal = 'GMV Max' WHERE canal = 'TikTok Ads';
UPDATE public.daily_metrics SET canal = 'GMV Max' WHERE canal = 'tiktok';
UPDATE public.daily_metrics SET canal = 'Meta' WHERE canal = 'meta';
UPDATE public.daily_metrics SET canal = 'Google' WHERE canal = 'Google';
UPDATE public.daily_metrics SET canal = 'Orgánico' WHERE canal IN ('shopify', 'organico', 'mayoreo', 'Orgánico');

-- Re-create constraint with new allowed values
ALTER TABLE public.daily_metrics ADD CONSTRAINT daily_metrics_canal_check 
  CHECK (canal = ANY (ARRAY['Meta'::text, 'Google'::text, 'TikTok Ads'::text, 'GMV Max'::text, 'TikTok Lives'::text, 'Orgánico'::text, 'Lives'::text, 'Mercado Libre'::text, 'Email'::text, 'Afiliados TikTok'::text, 'Burbuxa'::text, 'Amazon'::text]));
