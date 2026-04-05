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
  computed_actual?: number;
  weekly_totals?: Record<string, number>;
}

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
      const { data: objetivos, error } = await supabase
        .from('objetivos')
        .select('*')
        .eq('brand', activeBrand)
        .eq('periodo', periodo)
        .order('meta_value', { ascending: false });
      if (error) throw error;

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const { error } = await supabase
        .from('objetivos')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✓ Guardado');
      queryClient.invalidateQueries({ queryKey: ['objetivos'] });
    },
    onError: (err: Error) => {
      toast.error('Error: ' + err.message);
    },
  });
}
