import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Brand } from '@/store/useAppStore';

const MESES_ES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

export const KPI_CANAL_MAP: Record<string, string> = {
  ventas_meta: 'Meta',
  ventas_tiktok_ads: 'TikTok Ads',
  ventas_gmv: 'GMV Max',
  ventas_lives: 'TikTok Lives',
  ventas_ml: 'Mercado Libre',
  ventas_google: 'Google',
  ventas_email: 'Email',
};

function getPeriodo(date: Date) {
  return `${MESES_ES[date.getMonth()]}-${date.getFullYear()}`;
}

function startOfMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface MetricRow {
  id: string;
  brand: string;
  date: string;
  canal: string;
  ventas_brutas: number;
  pedidos: number;
  descuentos: number;
  devoluciones: number;
  cogs: number;
  guias: number;
  comision_tts: number;
  iva_ads: number;
  retenciones: number;
  anuncios: number;
  costo_host: number;
  nomina: number;
  gastos_fijos: number;
}

export interface KpiRow {
  id: string;
  brand: string;
  periodo: string;
  kpi_slug: string;
  kpi_name: string;
  valor_actual: number | null;
  valor_target: number | null;
  unidad: string | null;
  status: string | null;
}

export function calcVentasNetas(rows: MetricRow[]) {
  return rows.reduce((s, r) => s + (r.ventas_brutas || 0) - (r.descuentos || 0) - (r.devoluciones || 0), 0);
}

export function calcCostos(rows: MetricRow[]) {
  return rows.reduce((s, r) =>
    s + (r.cogs || 0) + (r.guias || 0) + (r.comision_tts || 0) + (r.iva_ads || 0) +
    (r.retenciones || 0) + (r.anuncios || 0) + (r.costo_host || 0) + (r.nomina || 0) + (r.gastos_fijos || 0), 0);
}

export function calcGastoAds(rows: MetricRow[]) {
  return rows.reduce((s, r) => s + (r.anuncios || 0), 0);
}

export function useDashboardData(activeBrand: Brand) {
  const now = new Date();
  const periodo = getPeriodo(now);
  const from = startOfMonth(now);
  const to = todayStr();

  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics', activeBrand, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('brand', activeBrand)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        ventas_brutas: Number(r.ventas_brutas) || 0,
        pedidos: Number(r.pedidos) || 0,
        descuentos: Number(r.descuentos) || 0,
        devoluciones: Number(r.devoluciones) || 0,
        cogs: Number(r.cogs) || 0,
        guias: Number(r.guias) || 0,
        comision_tts: Number(r.comision_tts) || 0,
        iva_ads: Number(r.iva_ads) || 0,
        retenciones: Number(r.retenciones) || 0,
        anuncios: Number(r.anuncios) || 0,
        costo_host: Number(r.costo_host) || 0,
        nomina: Number(r.nomina) || 0,
        gastos_fijos: Number(r.gastos_fijos) || 0,
      })) as MetricRow[];
    },
    staleTime: 30000,
  });

  const kpisQuery = useQuery({
    queryKey: ['dashboard-kpis', activeBrand, periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpis_monthly')
        .select('*')
        .eq('brand', activeBrand)
        .eq('periodo', periodo);
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        valor_actual: r.valor_actual != null ? Number(r.valor_actual) : null,
        valor_target: r.valor_target != null ? Number(r.valor_target) : null,
      })) as KpiRow[];
    },
    staleTime: 30000,
  });

  return {
    metrics: metricsQuery.data || [],
    kpis: kpisQuery.data || [],
    isLoading: metricsQuery.isLoading || kpisQuery.isLoading,
    periodo,
  };
}
