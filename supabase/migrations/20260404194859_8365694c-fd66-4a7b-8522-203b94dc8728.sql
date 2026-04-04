ALTER TABLE public.daily_metrics DROP CONSTRAINT daily_metrics_canal_check;
ALTER TABLE public.daily_metrics ADD CONSTRAINT daily_metrics_canal_check CHECK (canal = ANY (ARRAY[
  'tiktok','shopify','meta','mayoreo','organico',
  'Meta','TikTok Ads','GMV MAX','Lives','Mercado Libre','Google','Email','Afiliados TikTok','Burbuxa','Amazon'
]));