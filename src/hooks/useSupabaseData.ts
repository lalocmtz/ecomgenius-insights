import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useEffect } from 'react';
import { toast } from 'sonner';

// ─── Lives ───
export function useLives() {
  const { activeBrand, dateRange } = useAppStore();
  return useQuery({
    queryKey: ['lives', activeBrand, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lives_analysis')
        .select('*')
        .eq('brand', activeBrand)
        .gte('fecha', dateRange.from.toISOString().split('T')[0])
        .lte('fecha', dateRange.to.toISOString().split('T')[0])
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ─── KPIs ───
export function useKPIs(brand?: string) {
  const { activeBrand } = useAppStore();
  const b = brand || activeBrand;
  return useQuery({
    queryKey: ['kpis', b],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpis_monthly')
        .select('*')
        .eq('brand', b)
        .order('periodo', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ─── Daily Metrics ───
export function useDailyMetrics(canal?: string) {
  const { activeBrand, dateRange } = useAppStore();
  return useQuery({
    queryKey: ['daily_metrics', activeBrand, dateRange.from, dateRange.to, canal],
    queryFn: async () => {
      let q = supabase
        .from('daily_metrics')
        .select('*')
        .eq('brand', activeBrand)
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0])
        .order('date', { ascending: false });
      if (canal) q = q.eq('canal', canal);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ─── Creativos ───
export function useCreativos() {
  const { activeBrand } = useAppStore();
  return useQuery({
    queryKey: ['creativos', activeBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creativos')
        .select('*')
        .eq('brand', activeBrand)
        .order('roas', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ─── Orgánico Posts ───
export function useOrganicoPosts() {
  const { activeBrand } = useAppStore();
  return useQuery({
    queryKey: ['organico_posts', activeBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organico_posts')
        .select('*')
        .eq('brand', activeBrand)
        .order('fecha_publicacion', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}


// ─── Agent Conversations ───
export function useAgentConversations() {
  const { activeBrand } = useAppStore();
  return useQuery({
    queryKey: ['agent_conversations', activeBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('brand', activeBrand);
      if (error) throw error;
      return data;
    },
  });
}

// ─── Agent Daily Runs ───
export function useAgentDailyRuns() {
  return useQuery({
    queryKey: ['agent_daily_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_daily_runs')
        .select('*')
        .order('ran_at', { ascending: false })
        .limit(14);
      if (error) throw error;
      return data;
    },
  });
}

// ─── Margin Scenarios ───
export function useMarginScenarios() {
  const { activeBrand } = useAppStore();
  return useQuery({
    queryKey: ['margin_scenarios', activeBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('margin_scenarios')
        .select('*')
        .eq('brand', activeBrand)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ─── Generic Update Mutation ───
export function useUpdateCell(table: 'lives_analysis' | 'daily_metrics' | 'kpis_monthly' | 'creativos' | 'organico_posts') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const { error } = await supabase
        .from(table)
        .update({ [field]: value } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✓ Guardado');
      queryClient.invalidateQueries();
    },
    onError: (err: Error) => {
      toast.error('Error al guardar: ' + err.message);
    },
  });
}

// ─── Save Margin Scenario ───
export function useSaveScenario() {
  const queryClient = useQueryClient();
  const { activeBrand } = useAppStore();
  return useMutation({
    mutationFn: async (scenario: { nombre: string; aov: number; roas_objetivo: number; costo_host: number; margen_estimado: number; cpa_proyectado: number; profit_unitario: number }) => {
      const { error } = await supabase
        .from('margin_scenarios')
        .insert({ ...scenario, brand: activeBrand });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Escenario guardado');
      queryClient.invalidateQueries({ queryKey: ['margin_scenarios'] });
    },
  });
}

// ─── Hosts ───
export function useHosts() {
  const { activeBrand } = useAppStore();
  return useQuery({
    queryKey: ['hosts', activeBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosts')
        .select('*')
        .eq('brand', activeBrand)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddHost() {
  const queryClient = useQueryClient();
  const { activeBrand } = useAppStore();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const { error } = await supabase
        .from('hosts')
        .insert({ name: name.toUpperCase(), brand: activeBrand, color: color || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Host agregado');
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
    onError: (err: Error) => {
      toast.error('Error: ' + err.message);
    },
  });
}

// ─── Offer Tests (Live Segments) ───
export function useOfferTests(liveId: string | null) {
  return useQuery({
    queryKey: ['live_offer_tests', liveId],
    enabled: !!liveId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_offer_tests')
        .select('*')
        .eq('live_id', liveId!)
        .order('hora_inicio', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllOfferTests(liveIds: string[]) {
  return useQuery({
    queryKey: ['live_offer_tests_all', liveIds],
    enabled: liveIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_offer_tests')
        .select('*')
        .in('live_id', liveIds)
        .order('hora_inicio', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddOfferTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (test: { live_id: string; brand: string; hora_inicio: string; hora_fin: string; comunicacion: string; ventas: number; pedidos: number; gasto_ads: number }) => {
      const { error } = await supabase
        .from('live_offer_tests')
        .insert(test);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Prueba registrada');
      queryClient.invalidateQueries({ queryKey: ['live_offer_tests'] });
      queryClient.invalidateQueries({ queryKey: ['live_offer_tests_all'] });
    },
    onError: (err: Error) => toast.error('Error: ' + err.message),
  });
}

export function useDeleteOfferTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('live_offer_tests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Prueba eliminada');
      queryClient.invalidateQueries({ queryKey: ['live_offer_tests'] });
      queryClient.invalidateQueries({ queryKey: ['live_offer_tests_all'] });
    },
    onError: (err: Error) => toast.error('Error: ' + err.message),
  });
}

// ─── Realtime Subscription Hook ───
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const tables = ['lives_analysis', 'daily_metrics', 'kpis_monthly', 'objetivos', 'creativos', 'organico_posts', 'agent_conversations', 'agent_daily_runs', 'hosts', 'live_offer_tests'] as const;
    
    const channel = supabase
      .channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const table = payload.table;
        if (tables.includes(table as any)) {
          queryClient.invalidateQueries({ queryKey: [table] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
