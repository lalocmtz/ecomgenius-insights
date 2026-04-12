import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export interface CostPreset {
  id: string;
  name: string;
  description?: string;
  product_cost_mode: "pct" | "fixed";
  product_cost_pct?: number;
  product_cost_fixed?: number;
  guias_pct: number;
  tt_commission_pct: number;
  iva_ads_pct: number;
  retencion_base_pct: number;
  costo_host?: number;
  roas_value?: number;
  has_ads: boolean;
  is_default: boolean;
}

export function useCostPresets(brandId: string) {
  const [presets, setPresets] = useState<CostPreset[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar presets
  useEffect(() => {
    loadPresets();
  }, [brandId]);

  const loadPresets = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("predefined_cost_presets")
        .select("*")
        .eq("brand_id", brandId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPresets(data || []);
    } catch (error) {
      console.error("Error loading presets:", error);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  // Guardar preset
  const savePreset = useCallback(
    async (
      name: string,
      description: string,
      costs: {
        product_cost_mode: "pct" | "fixed";
        product_cost_pct?: number;
        product_cost_fixed?: number;
        guias_pct: number;
        tt_commission_pct: number;
        iva_ads_pct: number;
        retencion_base_pct: number;
        costo_host?: number;
        roas_value?: number;
        has_ads: boolean;
      },
      brandId: string
    ) => {
      try {
        // Obtener user_id del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user authenticated");

        const { error, data } = await supabase
          .from("predefined_cost_presets")
          .insert({
            name,
            description,
            brand_id: brandId,
            user_id: user.id,
            is_default: false,
            ...costs,
          })
          .select();

        if (error) throw error;
        await loadPresets();
        return data?.[0];
      } catch (error) {
        console.error("Error saving preset:", error);
        throw error;
      }
    },
    [loadPresets]
  );

  // Eliminar preset
  const deletePreset = useCallback(
    async (presetId: string) => {
      try {
        const { error } = await supabase
          .from("predefined_cost_presets")
          .delete()
          .eq("id", presetId);

        if (error) throw error;
        await loadPresets();
      } catch (error) {
        console.error("Error deleting preset:", error);
        throw error;
      }
    },
    [loadPresets]
  );

  // Marcar como default
  const setAsDefault = useCallback(
    async (presetId: string, brandId: string) => {
      try {
        // Desmarcar todos
        await supabase
          .from("predefined_cost_presets")
          .update({ is_default: false })
          .eq("brand_id", brandId);

        // Marcar el actual
        const { error } = await supabase
          .from("predefined_cost_presets")
          .update({ is_default: true })
          .eq("id", presetId);

        if (error) throw error;
        await loadPresets();
      } catch (error) {
        console.error("Error setting default preset:", error);
      }
    },
    [loadPresets]
  );

  return {
    presets,
    loading,
    savePreset,
    deletePreset,
    setAsDefault,
    refresh: loadPresets,
  };
}
