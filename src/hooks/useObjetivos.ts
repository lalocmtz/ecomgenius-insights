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
}

export function useObjetivos(periodo = 'ABR-2026') {
  const { activeBrand } = useAppStore();

  return useQuery({
    queryKey: ['objetivos', activeBrand, periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objetivos')
        .select('*')
        .eq('brand', activeBrand)
        .eq('periodo', periodo)
        .order('meta_value', { ascending: false });
      if (error) throw error;
      return (data || []).map((obj): Objetivo => ({
        ...obj,
        weekly_feedback: (obj.weekly_feedback as any[]) || [],
      }));
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
