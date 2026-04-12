"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Brand } from "@/types";
import type { CostPreset } from "@/hooks/useCostPresets";
import { SimuladorLivesPlans } from "./SimuladorLivesPlans";
import { SimuladorLivesDuring } from "./SimuladorLivesDuring";

// Estado unificado para ambos modos
interface LiveSimState {
  // Datos de planificación
  gmvTarget: number;
  aov: number;
  roas: number;
  hasAds: boolean;

  // Datos en vivo
  ventaActual: number;
  pedidosActuales: number;
  gastoAdsActual: number;

  // Costos compartidos
  productCostMode: "pct" | "fixed";
  productCostPct: number;
  productCostFixed: number;
  guiasPct: number;
  ttCommissionPct: number;
  ivaAdsPct: number;
  retencionBasePct: number;
  costoHost: number;

  // UI state
  costsOpen: boolean;
  presetsOpen: boolean;
}

const DEFAULT: LiveSimState = {
  // Planificación
  gmvTarget: 5000,
  aov: 349,
  roas: 3.0,
  hasAds: true,

  // En vivo
  ventaActual: 0,
  pedidosActuales: 0,
  gastoAdsActual: 0,

  // Costos
  productCostMode: "pct",
  productCostPct: 12,
  productCostFixed: 65,
  guiasPct: 6,
  ttCommissionPct: 8,
  ivaAdsPct: 16,
  retencionBasePct: 10.5,
  costoHost: 0,

  costsOpen: true,
  presetsOpen: false,
};

export function SimuladorLivesTab({ brand }: { brand: Brand }) {
  const [s, setS] = useState<LiveSimState>({
    ...DEFAULT,
    productCostPct: brand?.product_cost_pct ?? 12,
    guiasPct: brand?.commission_affiliates ?? 6,
    ttCommissionPct: brand?.commission_tiktok ?? 8,
    ivaAdsPct: brand?.iva_ads_pct ?? 16,
  });

  const update = useCallback(
    ((key: string, value: any) => {
      setS((prev) => ({ ...prev, [key]: value }));
    }) as any,
    []
  );

  const handleSelectPreset = (preset: CostPreset) => {
    setS((prev) => ({
      ...prev,
      product_cost_mode: preset.product_cost_mode,
      productCostMode: preset.product_cost_mode,
      productCostPct: preset.product_cost_pct || 12,
      productCostFixed: preset.product_cost_fixed || 65,
      guiasPct: preset.guias_pct,
      ttCommissionPct: preset.tt_commission_pct,
      ivaAdsPct: preset.iva_ads_pct,
      retencionBasePct: preset.retencion_base_pct,
      costoHost: preset.costo_host || 0,
      hasAds: preset.has_ads,
      roas: preset.roas_value || 3.0,
    }));
  };

  // Datos para los sub-modos
  const planningState = {
    gmvTarget: s.gmvTarget,
    aov: s.aov,
    roas: s.roas,
    hasAds: s.hasAds,
    productCostMode: s.productCostMode,
    productCostPct: s.productCostPct,
    productCostFixed: s.productCostFixed,
    guiasPct: s.guiasPct,
    ttCommissionPct: s.ttCommissionPct,
    ivaAdsPct: s.ivaAdsPct,
    retencionBasePct: s.retencionBasePct,
    costoHost: s.costoHost,
    costsOpen: s.costsOpen,
    presetsOpen: s.presetsOpen,
  };

  const duringState = {
    ventaActual: s.ventaActual,
    pedidosActuales: s.pedidosActuales,
    gastoAdsActual: s.gastoAdsActual,
    productCostMode: s.productCostMode,
    productCostPct: s.productCostPct,
    productCostFixed: s.productCostFixed,
    guiasPct: s.guiasPct,
    ttCommissionPct: s.ttCommissionPct,
    ivaAdsPct: s.ivaAdsPct,
    retencionBasePct: s.retencionBasePct,
    costoHost: s.costoHost,
    presetsOpen: s.presetsOpen,
  };

  return (
    <Tabs defaultValue="planificar">
      <TabsList variant="line" className="mb-6 border-b border-[#30363d] pb-px">
        <TabsTrigger value="planificar">📈 Planificar Live</TabsTrigger>
        <TabsTrigger value="en-curso">🎬 Live en Curso</TabsTrigger>
      </TabsList>

      <TabsContent value="planificar">
        <SimuladorLivesPlans
          state={planningState}
          update={update}
          brand={brand}
          handleSelectPreset={handleSelectPreset}
        />
      </TabsContent>

      <TabsContent value="en-curso">
        <SimuladorLivesDuring
          state={duringState}
          update={update}
          brand={brand}
          handleSelectPreset={handleSelectPreset}
        />
      </TabsContent>
    </Tabs>
  );
}
