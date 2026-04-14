"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { Brand } from "@/types";
import type { CostPreset } from "@/hooks/useCostPresets";
import { CostPresetsModal } from "./CostPresetsModal";
import { LiveSessionCostsEditor } from "./LiveSessionCostsEditor";
import { SellerCenterAnalytics } from "./SellerCenterAnalytics";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncSellerCenterData, mapSellerDataToSimulatorState } from "@/lib/seller-center";
import { supabase } from "@/lib/supabase/client";
import {
  computeDuringLive,
  formatMX,
  pct,
  getMarginColor,
  getMarginBg,
  getDuringLiveInsights,
} from "@/lib/calculos/liveCalcUtils";

export interface SessionCosts {
  productCostMode?: "pct" | "fixed";
  productCostPct?: number;
  productCostFixed?: number;
  guiasPct?: number;
  ttCommissionPct?: number;
  ivaAdsPct?: number;
  retencionBasePct?: number;
  costoHost?: number;
}

interface DuringLiveState {
  ventaActual: number;
  pedidosActuales: number;
  gastoAdsActual: number;
  productCostMode: "pct" | "fixed";
  productCostPct: number;
  productCostFixed: number;
  guiasPct: number;
  ttCommissionPct: number;
  ivaAdsPct: number;
  retencionBasePct: number;
  costoHost: number;
  presetsOpen: boolean;
  analyticsOpen?: boolean;
  // Session-specific costs (override preset)
  sessionCosts?: SessionCosts;
  isEditingSessionCosts?: boolean;
  isLoadingSellerData?: boolean;
}

interface SimuladorLivesDuringProps {
  state: DuringLiveState;
  update: (key: string, value: any) => void;
  brand: Brand;
  handleSelectPreset: (preset: CostPreset) => void;
}

export function SimuladorLivesDuring({
  state: s,
  update,
  brand,
  handleSelectPreset,
}: SimuladorLivesDuringProps) {
  // Estado para userId obtenido de autenticación
  const [userId, setUserId] = useState<string>("");

  // Obtener userId cuando el componente se monta
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });
  }, []);

  const mergedCosts = {
    productCostMode: s.sessionCosts?.productCostMode ?? s.productCostMode,
    productCostPct: s.sessionCosts?.productCostPct ?? s.productCostPct,
    productCostFixed: s.sessionCosts?.productCostFixed ?? s.productCostFixed,
    guiasPct: s.sessionCosts?.guiasPct ?? s.guiasPct,
    ttCommissionPct: s.sessionCosts?.ttCommissionPct ?? s.ttCommissionPct,
    ivaAdsPct: s.sessionCosts?.ivaAdsPct ?? s.ivaAdsPct,
    retencionBasePct: s.sessionCosts?.retencionBasePct ?? s.retencionBasePct,
    costoHost: s.sessionCosts?.costoHost ?? s.costoHost,
  };

  const C = useMemo(
    () =>
      computeDuringLive({
        gmv: s.ventaActual,
        pedidos: s.pedidosActuales,
        aov: s.pedidosActuales > 0 ? s.ventaActual / s.pedidosActuales : 0,
        gastoAdsActual: s.gastoAdsActual,
        hasAds: s.gastoAdsActual > 0,
        productCostMode: mergedCosts.productCostMode,
        productCostPct: mergedCosts.productCostPct,
        productCostFixed: mergedCosts.productCostFixed,
        guiasPct: mergedCosts.guiasPct,
        ttCommissionPct: mergedCosts.ttCommissionPct,
        ivaAdsPct: mergedCosts.ivaAdsPct,
        retencionBasePct: mergedCosts.retencionBasePct,
        costoHost: mergedCosts.costoHost,
      }),
    [s, mergedCosts]
  );

  const insights = useMemo(() => getDuringLiveInsights(C, 20), [C]);

  return (
    <div className="flex gap-5 items-start flex-col lg:flex-row">
      {/* ── LEFT: REAL-TIME INPUTS ── */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 space-y-4">
        {/* BLOQUE 0: Presets + Seller Center */}
        {brand?.id && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => update("presetsOpen", !s.presetsOpen)}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#f97316]/20 to-[#f97316]/5 border border-[#f97316]/30 px-4 py-2 text-sm font-semibold text-[#f97316] hover:border-[#f97316]/60 transition-colors"
              >
                📋 Editar Costos
              </button>
              <button
                onClick={async () => {
                  update("isLoadingSellerData", true);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Not authenticated");

                    const sellerData = await syncSellerCenterData(brand.id, user.id);
                    const mappedData = mapSellerDataToSimulatorState(sellerData);

                    Object.entries(mappedData).forEach(([key, value]) => {
                      update(key, value);
                    });

                    toast.success("Datos del Seller Center actualizado s ✓");
                  } catch (error: any) {
                    console.error("[SellerCenter] Error:", error);
                    toast.error(
                      error?.message?.includes("simulated")
                        ? "Usando datos de prueba (Cowork próxima)"
                        : `Error: ${error?.message}`
                    );
                  } finally {
                    update("isLoadingSellerData", false);
                  }
                }}
                disabled={s.isLoadingSellerData}
                className="rounded-xl bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm font-semibold text-green-500 hover:border-green-500/60 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                title="Extraer datos del TikTok Seller Center"
              >
                <RefreshCw className={`h-4 w-4 ${s.isLoadingSellerData ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Seller Center</span>
              </button>
            </div>
            <CostPresetsModal
              brandId={brand.id}
              isOpen={s.presetsOpen}
              onClose={() => update("presetsOpen", false)}
              onSelectPreset={(preset) => {
                handleSelectPreset(preset);
                update("presetsOpen", false);
              }}
              currentValues={{
                product_cost_mode: s.productCostMode,
                product_cost_pct: s.productCostPct,
                product_cost_fixed: s.productCostFixed,
                guias_pct: s.guiasPct,
                tt_commission_pct: s.ttCommissionPct,
                iva_ads_pct: s.ivaAdsPct,
                retencion_base_pct: s.retencionBasePct,
                costo_host: s.costoHost,
                roas_value: C?.roasActual || 1,
                has_ads: s.gastoAdsActual > 0,
              }}
            />
          </>
        )}

        {/* BLOQUE 1: Datos en Vivo */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            📊 Datos en Vivo
          </label>

          <div className="space-y-3">
            {/* Venta Actual */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Venta Actual</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  MX$
                </span>
                <input
                  type="number"
                  value={s.ventaActual || ""}
                  onChange={(e) => update("ventaActual", parseFloat(e.target.value) || 0)}
                  placeholder="2019.70"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-3 py-3 text-white text-lg font-bold focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder:text-gray-600"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">¿Cuánto llevas vendido?</p>
            </div>

            {/* Pedidos Actuales */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Pedidos Actuales</label>
              <input
                type="number"
                value={s.pedidosActuales || ""}
                onChange={(e) => update("pedidosActuales", parseInt(e.target.value) || 0)}
                placeholder="8"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-3 text-white text-lg font-bold focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder:text-gray-600"
              />
              <p className="text-xs text-gray-600 mt-1">¿Cuántos pedidos tienes?</p>
            </div>

            {/* Gasto Ads Actual */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Gasto en Ads Actual</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  MX$
                </span>
                <input
                  type="number"
                  value={s.gastoAdsActual || ""}
                  onChange={(e) => update("gastoAdsActual", parseFloat(e.target.value) || 0)}
                  placeholder="893.94"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-3 py-3 text-white text-lg font-bold focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder:text-gray-600"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">¿Cuánto llevas gastado en publicidad?</p>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: Costos Editables */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Configuración de Costos
          </label>

          <div className="space-y-3 text-xs">
            {/* Costo Producto */}
            <div className="space-y-1">
              <label className="text-gray-500 block">Costo Producto</label>
              <div className="flex gap-2">
                <select
                  value={s.productCostMode}
                  onChange={(e) => update("productCostMode", e.target.value as "pct" | "fixed")}
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                >
                  <option value="pct">% AOV</option>
                  <option value="fixed">MX$ Fijo</option>
                </select>
                <input
                  type="number"
                  value={s.productCostMode === "pct" ? s.productCostPct : s.productCostFixed}
                  onChange={(e) => {
                    if (s.productCostMode === "pct") {
                      update("productCostPct", parseFloat(e.target.value) || 0);
                    } else {
                      update("productCostFixed", parseFloat(e.target.value) || 0);
                    }
                  }}
                  className="w-20 bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                  step="0.1"
                />
              </div>
            </div>

            {/* Comisión TikTok */}
            <div className="space-y-1">
              <label className="text-gray-500 block">Comisión TikTok (%)</label>
              <input
                type="number"
                value={s.ttCommissionPct}
                onChange={(e) => update("ttCommissionPct", parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>

            {/* Guías/Afiliados */}
            <div className="space-y-1">
              <label className="text-gray-500 block">Guías/Afiliados (%)</label>
              <input
                type="number"
                value={s.guiasPct}
                onChange={(e) => update("guiasPct", parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>

            {/* Retenciones ISR */}
            <div className="space-y-1">
              <label className="text-gray-500 block">Retenciones ISR (%)</label>
              <input
                type="number"
                value={s.retencionBasePct}
                onChange={(e) => update("retencionBasePct", parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>

            {/* IVA Ads */}
            <div className="space-y-1">
              <label className="text-gray-500 block">IVA Ads (%)</label>
              <input
                type="number"
                value={s.ivaAdsPct}
                onChange={(e) => update("ivaAdsPct", parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>

            {/* Costo Host */}
            <div className="space-y-1">
              <label className="text-gray-500 block">Costo Host (MX$)</label>
              <input
                type="number"
                value={s.costoHost}
                onChange={(e) => update("costoHost", parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 2: Session Costs Editor */}
        <LiveSessionCostsEditor
          isOpen={s.isEditingSessionCosts ?? false}
          onToggle={() => update("isEditingSessionCosts", !s.isEditingSessionCosts)}
          sessionCosts={s.sessionCosts}
          baseValues={{
            productCostMode: s.productCostMode,
            productCostPct: s.productCostPct,
            productCostFixed: s.productCostFixed,
            guiasPct: s.guiasPct,
            ttCommissionPct: s.ttCommissionPct,
            ivaAdsPct: s.ivaAdsPct,
            retencionBasePct: s.retencionBasePct,
            costoHost: s.costoHost,
          }}
          onUpdate={update}
          onResetSessionCosts={() => update("sessionCosts", undefined)}
        />
        {/* BLOQUE 3: Analytics - Últimos 60 días */}
        {brand?.id && userId && (
          <SellerCenterAnalytics
            brandId={brand.id}
            userId={userId}
            days={60}
            isOpen={s.analyticsOpen ?? false}
            onToggle={() => update("analyticsOpen", !s.analyticsOpen)}
          />
        )}
      </div>

      {/* ── RIGHT: LIVE METRICS ── */}
      <div className="flex-1 min-w-0 space-y-4 w-full">
        {!C ? (
          <div className="flex items-center justify-center h-80 rounded-xl border border-[#30363d] bg-[#161b22]">
            <div className="text-center">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-gray-400 font-medium">
                Ingresa datos del live para ver métricas en tiempo real
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Actualiza estos datos conforme el live transcurra
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* TOP KPI CARDS — 4 columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Margen Actual */}
              <div
                className={`rounded-xl border p-4 ${getMarginBg(C.netMarginPct)}`}
              >
                <p className="text-xs text-gray-400 mb-1">Margen Actual</p>
                <p
                  className={`text-xl font-black ${getMarginColor(C.netMarginPct)}`}
                >
                  {formatMX(C.netProfit)}
                </p>
                <p
                  className={`text-xs font-bold mt-0.5 ${getMarginColor(C.netMarginPct)}`}
                >
                  {pct(C.netMarginPct)}
                </p>
              </div>

              {/* ROAS Actual */}
              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <p className="text-xs text-gray-400 mb-1">ROAS Actual</p>
                <p
                  className={`text-xl font-black ${
                    C.roasActual && C.roasActual >= 3
                      ? "text-green-400"
                      : C.roasActual && C.roasActual >= 2
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {C.roasActual ? `${C.roasActual.toFixed(2)}x` : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">retorno en publicidad</p>
              </div>

              {/* AOV Real */}
              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <p className="text-xs text-gray-400 mb-1">AOV Real</p>
                <p className="text-xl font-black text-white">{formatMX(C.aov)}</p>
                <p className="text-xs text-gray-500 mt-0.5">promedio por pedido</p>
              </div>

              {/* Costo por Pedido */}
              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <p className="text-xs text-gray-400 mb-1">Costo x Pedido</p>
                <p className={`text-xl font-black ${C.marginPerUnit >= 0 ? "text-white" : "text-red-400"}`}>
                  {formatMX(C.marginPerUnit)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">utilidad unitaria</p>
              </div>
            </div>

            {/* ¿QUE NECESITAS PARA SER RENTABLE? */}
            <div
              className={`rounded-xl border p-4 space-y-2 ${
                C.netMarginPct >= 20
                  ? "bg-green-950/40 border-green-900/50"
                  : C.netMarginPct >= 0
                    ? "bg-amber-950/40 border-amber-900/50"
                    : "bg-red-950/40 border-red-900/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {C.netMarginPct >= 20 ? "✅" : C.netMarginPct >= 0 ? "⚠️" : "❌"}
                </span>
                <div className="space-y-1 flex-1">
                  {insights.map((insight, i) => (
                    <p
                      key={i}
                      className={`text-xs ${
                        i === 0
                          ? `font-semibold ${
                              C.netMarginPct >= 20
                                ? "text-green-300"
                                : C.netMarginPct >= 0
                                  ? "text-amber-300"
                                  : "text-red-300"
                            }`
                          : "text-gray-400"
                      }`}
                    >
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* P&L COMPACTO */}
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
              <div className="px-4 py-3 bg-[#30363d]/40 border-b border-[#30363d]">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Estado de Resultados — Live en Curso
                </p>
              </div>
              <div className="p-4 space-y-0">
                {(
                  [
                    {
                      label: `(+) Venta ${C.pedidos} pedidos @ ${formatMX(C.aov)}`,
                      value: C.gmv,
                      pctVal: 100,
                      bold: true,
                      color: "text-white",
                    },
                    {
                      label: `(-) Costo Producto`,
                      value: -C.productCost,
                      pctVal: -(C.productCost / C.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: `(-) Comisiones (TikTok + Guías + ISR)`,
                      value: -(C.ttComm + C.guias + C.retenciones),
                      pctVal: -((C.ttComm + C.guias + C.retenciones) / C.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: "(-) Gasto en Ads",
                      value: -C.gastoAds,
                      pctVal: -(C.gastoAds / C.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: `(-) IVA Ads (${s.ivaAdsPct}%)`,
                      value: -C.ivaAds,
                      pctVal: -(C.ivaAds / C.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: "= MARGEN BRUTO",
                      value: C.grossMargin,
                      pctVal: C.grossMarginPct,
                      bold: true,
                      divider: true,
                      color: C.grossMargin >= 0 ? "text-green-400" : "text-red-400",
                    },
                    ...(s.costoHost > 0
                      ? [
                          {
                            label: "(-) Costo Host",
                            value: -s.costoHost,
                            pctVal: -(s.costoHost / C.gmv) * 100,
                            color: "text-red-400",
                            indent: true,
                          },
                          {
                            label: "= UTILIDAD NETA",
                            value: C.netProfit,
                            pctVal: C.netMarginPct,
                            bold: true,
                            divider: true,
                            color: C.netProfit >= 0 ? "text-green-400" : "text-red-400",
                          },
                        ]
                      : []),
                  ] as Array<{
                    label: string;
                    value: number;
                    pctVal: number;
                    bold?: boolean;
                    color: string;
                    indent?: boolean;
                    divider?: boolean;
                  }>
                ).map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-2 text-sm ${
                      row.divider ? "border-t border-[#30363d] mt-1 pt-3" : ""
                    } ${row.indent ? "pl-3" : ""}`}
                  >
                    <span
                      className={`${
                        row.bold ? "font-bold text-white" : "text-gray-400"
                      } ${row.indent ? "text-xs" : ""}`}
                    >
                      {row.label}
                    </span>
                    <div className="flex items-center gap-4">
                      <span
                        className={`${row.bold ? "font-bold" : "font-medium"} ${row.color} tabular-nums`}
                      >
                        {row.value >= 0
                          ? formatMX(row.value)
                          : `(${formatMX(Math.abs(row.value))})`}
                      </span>
                      <span className="text-gray-600 text-xs tabular-nums w-14 text-right">
                        {pct(row.pctVal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
