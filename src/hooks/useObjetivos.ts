import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

export interface Objetivo {
  id: string;
  brand: string;
  periodo: string;
  objetivo: string;
  responsable: string | null;
  meta_value: number | null;
  actual_value: number | null;
  unidad: string | null;
  semaforo: string | null;
  canal: string | null;
  asana_gid: string | null;
  weekly_feedback: any[];
  created_at: string | null;
  updated_at: string | null;
  meta_roas: number | null;
  presupuesto_mensual: number | null;
  presupuesto_invertido: number | null;
  resultado_venta: number | null;
  cantidad_lives: number | null;
  horas_lives: number | null;
  tipo: string | null;
  comentarios_bien: string | null;
  comentarios_mal: string | null;
  tareas_prioritarias: string | null;
  data_source: string | null;
  // Auto-filled fields (not in DB, computed client-side)
  auto_resultado_venta?: number;
  auto_presupuesto_invertido?: number;
  auto_cantidad_lives?: number;
  auto_horas_lives?: number;
  is_auto?: boolean;
}

const MONTH_MAP: Record<string, number> = {
  ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6,
  JUL: 7, AGO: 8, SEP: 9, OCT: 10, NOV: 11, DIC: 12,
};

function parsePeriodo(periodo: string): { from: string; to: string } | null {
  const [mes, año] = periodo.split('-');
  const m = MONTH_MAP[mes];
  if (!m || !año) return null;
  const y = parseInt(año);
  const lastDay = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, '0');
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${lastDay}` };
}

const SOURCE_TO_CANAL: Record<string, string> = {
  meta: 'Meta',
  Meta: 'Meta',
  google: 'Google',
  Google: 'Google',
  tiktok_ads: 'TikTok Ads',
  'TikTok Ads': 'TikTok Ads',
  tiktok_lives: 'TikTok Lives',
  'TikTok Lives': 'TikTok Lives',
  gmv_max: 'GMV Max',
  'GMV Max': 'GMV Max',
};

function parseDuracionToHours(d: string | null): number {
  if (!d) return 0;
  let hours = 0;
  const hMatch = d.match(/(\d+)\s*h/);
  const mMatch = d.match(/(\d+)\s*min/);
  if (hMatch) hours += parseInt(hMatch[1]);
  if (mMatch) hours += parseInt(mMatch[1]) / 60;
  return hours;
}

export function useObjetivos(periodo = 'ABR-2026') {
  const { activeBrand } = useAppStore();

  return useQuery({
    queryKey: ['objetivos', activeBrand, periodo],
    queryFn: async () => {
      // 1. Fetch objetivos
      const { data, error } = await supabase
        .from('objetivos')
        .select('*')
        .eq('brand', activeBrand)
        .eq('periodo', periodo)
        .order('meta_value', { ascending: false });
      if (error) throw error;

      const objs: Objetivo[] = (data || []).map((obj): Objetivo => ({
        ...obj,
        weekly_feedback: (obj.weekly_feedback as any[]) || [],
      }));

      // 2. Find which data sources need auto-fill
      const dates = parsePeriodo(periodo);
      if (!dates) return objs;

      const sourcesNeeded = new Set<string>();
      objs.forEach(o => {
        if (o.data_source && SOURCE_TO_CANAL[o.data_source]) {
          sourcesNeeded.add(SOURCE_TO_CANAL[o.data_source]);
        }
      });

      if (sourcesNeeded.size === 0) return objs;

      // 3. Fetch daily_metrics for all needed canals in one query
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('canal, ventas_brutas, anuncios')
        .eq('brand', activeBrand)
        .gte('date', dates.from)
        .lte('date', dates.to)
        .in('canal', Array.from(sourcesNeeded));

      // Aggregate by canal
      const byCanal: Record<string, { ventas: number; spend: number }> = {};
      (metrics || []).forEach(r => {
        if (!byCanal[r.canal]) byCanal[r.canal] = { ventas: 0, spend: 0 };
        byCanal[r.canal].ventas += Number(r.ventas_brutas || 0);
        byCanal[r.canal].spend += Number(r.anuncios || 0);
      });

      // 4. If TikTok Lives needed, also fetch lives_analysis
      let livesCount = 0;
      let livesHours = 0;
      if (sourcesNeeded.has('TikTok Lives')) {
        const { data: lives } = await supabase
          .from('lives_analysis')
          .select('duracion')
          .eq('brand', activeBrand)
          .gte('fecha', dates.from)
          .lte('fecha', dates.to);
        livesCount = (lives || []).length;
        livesHours = (lives || []).reduce((sum, l) => sum + parseDuracionToHours(l.duracion), 0);
      }

      // 5. Enrich objetivos with auto data
      return objs.map(obj => {
        const canal = obj.data_source ? SOURCE_TO_CANAL[obj.data_source] : null;
        if (!canal || !byCanal[canal]) {
          return { ...obj, is_auto: false };
        }
        const agg = byCanal[canal];
        const enriched: Objetivo = {
          ...obj,
          is_auto: true,
          auto_resultado_venta: agg.ventas,
          auto_presupuesto_invertido: agg.spend,
          resultado_venta: agg.ventas,
          presupuesto_invertido: agg.spend,
        };
        if (canal === 'TikTok Lives') {
          enriched.auto_cantidad_lives = livesCount;
          enriched.auto_horas_lives = Math.round(livesHours * 100) / 100;
          enriched.cantidad_lives = livesCount;
          enriched.horas_lives = Math.round(livesHours * 100) / 100;
        }
        return enriched;
      });
    },
  });
}

export function useUpdateObjetivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const { error } = await supabase
        .from('objetivos')
        .update({ [field]: value } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objetivos'] });
    },
    onError: (err: Error) => {
      toast.error('Error: ' + err.message);
    },
  });
}

export function useCreateObjetivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (obj: {
      brand: string;
      periodo: string;
      objetivo: string;
      tipo: string;
      responsable: string;
      meta_value?: number | null;
      meta_roas?: number | null;
      presupuesto_mensual?: number | null;
      data_source?: string | null;
    }) => {
      const { error } = await supabase.from('objetivos').insert({
        brand: obj.brand,
        periodo: obj.periodo,
        objetivo: obj.objetivo,
        tipo: obj.tipo,
        responsable: obj.responsable,
        meta_value: obj.meta_value ?? null,
        meta_roas: obj.meta_roas ?? null,
        presupuesto_mensual: obj.presupuesto_mensual ?? null,
        data_source: obj.data_source === 'Ninguno' ? null : (obj.data_source ?? null),
        semaforo: '🟡',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Objetivo creado');
      queryClient.invalidateQueries({ queryKey: ['objetivos'] });
    },
    onError: (err: Error) => {
      toast.error('Error: ' + err.message);
    },
  });
}
