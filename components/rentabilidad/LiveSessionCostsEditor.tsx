"use client";

import { ChevronDown, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { SessionCosts } from "./SimuladorLivesDuring";

interface LiveSessionCostsEditorProps {
  isOpen: boolean;
  onToggle: () => void;
  sessionCosts?: SessionCosts;
  baseValues: {
    productCostMode: "pct" | "fixed";
    productCostPct: number;
    productCostFixed: number;
    guiasPct: number;
    ttCommissionPct: number;
    ivaAdsPct: number;
    retencionBasePct: number;
    costoHost: number;
  };
  onUpdate: (key: string, value: any) => void;
  onResetSessionCosts: () => void;
}

export function LiveSessionCostsEditor({
  isOpen,
  onToggle,
  sessionCosts,
  baseValues,
  onUpdate,
  onResetSessionCosts,
}: LiveSessionCostsEditorProps) {
  const hasSessionCosts = sessionCosts && Object.keys(sessionCosts).length > 0;

  // Merge para mostrar qué valores están activos (base + session override)
  const effectiveValues = {
    productCostMode: sessionCosts?.productCostMode ?? baseValues.productCostMode,
    productCostPct: sessionCosts?.productCostPct ?? baseValues.productCostPct,
    productCostFixed: sessionCosts?.productCostFixed ?? baseValues.productCostFixed,
    guiasPct: sessionCosts?.guiasPct ?? baseValues.guiasPct,
    ttCommissionPct: sessionCosts?.ttCommissionPct ?? baseValues.ttCommissionPct,
    ivaAdsPct: sessionCosts?.ivaAdsPct ?? baseValues.ivaAdsPct,
    retencionBasePct: sessionCosts?.retencionBasePct ?? baseValues.retencionBasePct,
    costoHost: sessionCosts?.costoHost ?? baseValues.costoHost,
  };

  const handleSessionCostChange = (key: string, value: any) => {
    const newSessionCosts = {
      ...sessionCosts,
      [key]: value,
    };
    onUpdate("sessionCosts", newSessionCosts);
  };

  const handleSaveSessionCosts = () => {
    if (hasSessionCosts) {
      toast.success(`✓ Costos de sesión guardados para este live`);
    } else {
      toast.info("Sin cambios específicos de sesión");
    }
  };

  const handleResetSessionCosts = () => {
    onResetSessionCosts();
    toast.info("Costos de sesión reiniciados – usando preset");
  };

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
      {/* Header con toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between group"
      >
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gray-300">
          {hasSessionCosts ? "⚙️" : "⚙️"} Costos de Esta Sesión
        </label>
        <div className="flex items-center gap-2">
          {hasSessionCosts && (
            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-500 font-semibold">
              Customizado
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#30363d] space-y-3">
          <p className="text-xs text-gray-600">
            Modifica costos SOLO para este live. Los cambios no afectan el preset.
          </p>

          <div className="space-y-3 text-xs">
            {/* Costo Producto */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-500">Costo Producto</label>
                {sessionCosts?.productCostMode && (
                  <span className="text-orange-500 text-xs font-bold">CUSTOM</span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={effectiveValues.productCostMode}
                  onChange={(e) => {
                    const newMode = e.target.value as "pct" | "fixed";
                    handleSessionCostChange("productCostMode", newMode);
                  }}
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                >
                  <option value="pct">% AOV</option>
                  <option value="fixed">MX$ Fijo</option>
                </select>
                <input
                  type="number"
                  value={
                    effectiveValues.productCostMode === "pct"
                      ? effectiveValues.productCostPct
                      : effectiveValues.productCostFixed
                  }
                  onChange={(e) => {
                    if (effectiveValues.productCostMode === "pct") {
                      handleSessionCostChange(
                        "productCostPct",
                        parseFloat(e.target.value) || 0
                      );
                    } else {
                      handleSessionCostChange(
                        "productCostFixed",
                        parseFloat(e.target.value) || 0
                      );
                    }
                  }}
                  className="w-20 bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                  step="0.1"
                />
              </div>
            </div>

            {/* Comisión TikTok */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-500">Comisión TikTok (%)</label>
                {sessionCosts?.ttCommissionPct !== undefined && (
                  <span className="text-orange-500 text-xs font-bold">CUSTOM</span>
                )}
              </div>
              <input
                type="number"
                value={effectiveValues.ttCommissionPct}
                onChange={(e) =>
                  handleSessionCostChange("ttCommissionPct", parseFloat(e.target.value) || 0)
                }
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>

            {/* Guías/Afiliados */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-500">Guías/Afiliados (%)</label>
                {sessionCosts?.guiasPct !== undefined && (
                  <span className="text-orange-500 text-xs font-bold">CUSTOM</span>
                )}
              </div>
              <input
                type="number"
                value={effectiveValues.guiasPct}
                onChange={(e) =>
                  handleSessionCostChange("guiasPct", parseFloat(e.target.value) || 0)
                }
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>

            {/* Retenciones ISR */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-500">Retenciones ISR (%)</label>
                {sessionCosts?.retencionBasePct !== undefined && (
                  <span className="text-orange-500 text-xs font-bold">CUSTOM</span>
                )}
              </div>
              <input
                type="number"
                value={effectiveValues.retencionBasePct}
                onChange={(e) =>
                  handleSessionCostChange("retencionBasePct", parseFloat(e.target.value) || 0)
                }
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>

            {/* IVA Ads */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-500">IVA Ads (%)</label>
                {sessionCosts?.ivaAdsPct !== undefined && (
                  <span className="text-orange-500 text-xs font-bold">CUSTOM</span>
                )}
              </div>
              <input
                type="number"
                value={effectiveValues.ivaAdsPct}
                onChange={(e) =>
                  handleSessionCostChange("ivaAdsPct", parseFloat(e.target.value) || 0)
                }
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>

            {/* Costo Host */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-500">Costo Host (MX$)</label>
                {sessionCosts?.costoHost !== undefined && (
                  <span className="text-orange-500 text-xs font-bold">CUSTOM</span>
                )}
              </div>
              <input
                type="number"
                value={effectiveValues.costoHost}
                onChange={(e) =>
                  handleSessionCostChange("costoHost", parseFloat(e.target.value) || 0)
                }
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-2 text-white text-xs focus:border-orange-500 focus:outline-none"
                step="0.1"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-3 border-t border-[#30363d]">
            <button
              onClick={handleSaveSessionCosts}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <Save className="h-3.5 w-3.5" />
              Guardar Sesión
            </button>
            {hasSessionCosts && (
              <button
                onClick={handleResetSessionCosts}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#30363d] px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 hover:border-gray-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
