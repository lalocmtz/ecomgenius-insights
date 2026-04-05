import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';

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
  computed_actual?: number;
  weekly_totals?: Record<string, number>;
}

// Week definitions for April 2026
export const APRIL_WEEKS = [
  { label: 'Sem 1', from: '2026-04-01', to: '2026-04-06' },
  { label: 'Sem 2', from: '2026-04-07', to: '2026-04-13' },
  { label: 'Sem 3', from: '2026-04-14', to: '2026-04-20' },
  { label: 'Sem 4', from: '2026-04-21', to: '2026-04-27' },
  { label: 'Sem 5', from: '2026-04-28', to: '2026-04-30' },
];

export function useObjetivos(periodo = 'ABR-2026') {
  const { activeBrand } = useAppStore();

  return useQuery({
    queryKey: ['objetivos', activeBrand, periodo],
    queryFn: async () => {
      // Fetch objetivos
      const { data: objetivos, error } = await supabase
        .from('objetivos')
        .select('*')
        .eq('brand', activeBrand)
        .eq('periodo', periodo)
        .order('meta_value', { ascending: false });
      if (error) throw error;

      // Fetch daily_metrics for April 2026 to auto-calc canal-linked objetivos
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('canal, date, ventas_brutas')
        .eq('brand', activeBrand)
        .gte('date', '2026-04-01')
        .lte('date', '2026-04-30');

      const metricsRows = metrics || [];

      return (objetivos || []).map((obj): Objetivo => {
        let computed_actual = obj.actual_value;
        let weekly_totals: Record<string, number> = {};

        if (obj.canal) {
          const canalRows = metricsRows.filter(m => m.canal === obj.canal);
          computed_actual = canalRows.reduce((s, r) => s + Number(r.ventas_brutas || 0), 0);

          // Weekly breakdown
          for (const week of APRIL_WEEKS) {
            weekly_totals[week.label] = canalRows
              .filter(r => r.date >= week.from && r.date <= week.to)
              .reduce((s, r) => s + Number(r.ventas_brutas || 0), 0);
          }
        }

        return {
          ...obj,
          weekly_feedback: (obj.weekly_feedback as any[]) || [],
          computed_actual,
          weekly_totals,
        };
      });
    },
  });
}

export function useUpdateObjetivo() {
  const queryClient = (await import('@tanstack/react-query')).useQueryClient();
  const { useMutation } = await import('@tanstack/react-query');

  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const { error } = await supabase
        .from('objetivos')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objetivos'] });
    },
  });
}
