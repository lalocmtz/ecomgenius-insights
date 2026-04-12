"use client";

import { useState } from "react";
import { X, Save, Trash2, Star } from "lucide-react";
import { CostPreset, useCostPresets } from "@/hooks/useCostPresets";
import { toast } from "sonner";

interface PresetsModalProps {
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: CostPreset) => void;
  currentValues?: {
    name?: string;
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
  };
}

export function CostPresetsModal({
  brandId,
  isOpen,
  onClose,
  onSelectPreset,
  currentValues,
}: PresetsModalProps) {
  const { presets, loading, savePreset, deletePreset, setAsDefault } =
    useCostPresets(brandId);

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDesc, setPresetDesc] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

  if (!isOpen) return null;

  const handleSavePreset = async () => {
    if (!presetName.trim() || !currentValues) {
      toast.error("Ingresa un nombre para el preset");
      return;
    }

    setSavingPreset(true);
    try {
      await savePreset(presetName, presetDesc, currentValues, brandId);
      toast.success("Preset guardado");
      setPresetName("");
      setPresetDesc("");
      setShowSaveForm(false);
    } catch (error) {
      toast.error("Error guardando preset");
    } finally {
      setSavingPreset(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
      <div className="w-full max-w-md max-h-[80vh] rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <h2 className="text-lg font-semibold text-[#e6edf3]">
            Presets de Costos
          </h2>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#e6edf3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-[#8b949e] py-8">
              Cargando presets...
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center text-[#8b949e] py-8 text-sm">
              No hay presets guardados. Crea uno para ahorrar tiempo en simulaciones.
            </div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                  preset.is_default
                    ? "border-[#f97316] bg-[#f97316]/10"
                    : "border-[#30363d] bg-[#0d1117] hover:border-[#f97316]/50"
                }`}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#e6edf3]">
                      {preset.name}
                      {preset.is_default && (
                        <span className="ml-2 inline-block">
                          <Star className="h-3 w-3 fill-[#f97316] text-[#f97316]" />
                        </span>
                      )}
                    </p>
                    {preset.description && (
                      <p className="text-xs text-[#8b949e] mt-0.5">
                        {preset.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    {!preset.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsDefault(preset.id, brandId);
                        }}
                        className="p-1.5 rounded bg-[#30363d]/50 text-[#8b949e] hover:text-[#f97316]"
                        title="Marcar como predeterminado"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("¿Eliminar este preset?")) {
                          deletePreset(preset.id);
                        }
                      }}
                      className="p-1.5 rounded bg-[#30363d]/50 text-[#8b949e] hover:text-red-400"
                      title="Eliminar preset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick preview */}
                <div className="text-xs text-gray-600 space-y-0.5 mt-2">
                  {preset.product_cost_mode === "pct" ? (
                    <p>
                      Costo Prod: <span className="text-gray-400">{preset.product_cost_pct}% AOV</span>
                    </p>
                  ) : (
                    <p>
                      Costo Prod: <span className="text-gray-400">MX${preset.product_cost_fixed}</span>
                    </p>
                  )}
                  <p>
                    TT Comisión: <span className="text-gray-400">{preset.tt_commission_pct}%</span>
                  </p>
                  {preset.has_ads ? (
                    <p>
                      ROAS:{" "}
                      <span className="text-gray-400">
                        {preset.roas_value ? `${preset.roas_value}x` : "variable"}
                      </span>
                    </p>
                  ) : (
                    <p>
                      Pauta: <span className="text-gray-400">❌ Sin pauta</span>
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#30363d] p-4 space-y-3">
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              disabled={!currentValues}
            >
              <Save className="h-4 w-4" />
              Guardar Preset Actual
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre del preset"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] focus:border-[#f97316] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={presetDesc}
                onChange={(e) => setPresetDesc(e.target.value)}
                className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#8b949e] focus:border-[#f97316] focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="flex-1 rounded-lg border border-[#30363d] px-3 py-2 text-sm font-semibold text-[#e6edf3] hover:bg-[#0d1117]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePreset}
                  disabled={savingPreset}
                  className="flex-1 rounded-lg bg-[#f97316] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {savingPreset ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
