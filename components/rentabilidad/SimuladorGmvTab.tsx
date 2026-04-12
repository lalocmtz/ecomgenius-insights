"use client";

import { useState, useCallback, useMemo } from "react";
import type { Brand } from "@/types";

interface SimulatorState {
  gmv: number;
  roas: number;
  productCostMode: "pct" | "fixed";
  productCostPct: number;
  productCostFixed: number;
  guiasPct: number;
  ttCommissionPct: number;
  ivaAdsPct: number;
  retencionBasePct: number;
  fixedCosts: number;
  costsOpen: boolean;
}

const DEFAULT: SimulatorState = {
  gmv: 0,
  roas: 3.0,
  productCostMode: "pct",
  productCostPct: 12,
  productCostFixed: 65,
  guiasPct: 6,
  ttCommissionPct: 8,
  ivaAdsPct: 16,
  retencionBasePct: 10.5,
  fixedCosts: 0,
  costsOpen: true,
};

function compute(s: SimulatorState) {
  const gmv = s.gmv || 0;
  if (gmv === 0) return null;

  const gastoAds = s.roas > 0 ? gmv / s.roas : 0;
  const ivaAds = gastoAds * (s.ivaAdsPct / 100);

  const productCost =
    s.productCostMode === "fixed"
      ? s.productCostFixed
      : gmv * (s.productCostPct / 100);

  const guias = gmv * (s.guiasPct / 100);
  const ttComm = gmv * (s.ttCommissionPct / 100);
  const baseImponible = gmv * (1 - s.ttCommissionPct / 100 - s.guiasPct / 100);
  const retenciones = baseImponible * (s.retencionBasePct / 100);

  const totalVariableCosts =
    productCost + guias + ttComm + retenciones + gastoAds + ivaAds;
  const grossMargin = gmv - totalVariableCosts;
  const grossMarginPct = gmv > 0 ? (grossMargin / gmv) * 100 : 0;

  const netProfit = grossMargin - s.fixedCosts;
  const netMarginPct = gmv > 0 ? (netProfit / gmv) * 100 : 0;

  const breakEvenGMV =
    grossMarginPct > 0 && s.fixedCosts > 0
      ? s.fixedCosts / (grossMarginPct / 100)
      : 0;
  const breakEvenDelta = gmv - breakEvenGMV;

  const productPctEffective =
    s.productCostMode === "fixed"
      ? s.productCostFixed / Math.max(gmv, 1)
      : s.productCostPct / 100;
  const fixedVarPct =
    productPctEffective +
    s.guiasPct / 100 +
    s.ttCommissionPct / 100 +
    (baseImponible / gmv) * (s.retencionBasePct / 100);
  const ivaMultiplier = 1 + s.ivaAdsPct / 100;
  const remainder = 1 - fixedVarPct - (gmv > 0 ? s.fixedCosts / gmv : 0);
  const roasBreakEven = remainder > 0 ? ivaMultiplier / remainder : null;

  return {
    gastoAds,
    ivaAds,
    productCost,
    guias,
    ttComm,
    retenciones,
    totalVariableCosts,
    grossMargin,
    grossMarginPct,
    netProfit,
    netMarginPct,
    breakEvenGMV,
    breakEvenDelta,
    roasBreakEven,
  };
}

function formatMX(v: number, compact = false): string {
  if (compact && Math.abs(v) >= 1000) {
    return `MX$ ${(v / 1000).toFixed(1)}k`;
  }
  return `MX$ ${v.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function pct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function getMarginColor(m: number): string {
  if (m >= 25) return "text-green-400";
  if (m >= 10) return "text-amber-400";
  return "text-red-400";
}

function getMarginBg(m: number): string {
  if (m >= 25) return "bg-green-950/60 border-green-900/50";
  if (m >= 10) return "bg-amber-950/60 border-amber-900/50";
  return "bg-red-950/60 border-red-900/50";
}

export function SimuladorGmvTab({ brand }: { brand: Brand }) {
  const [s, setS] = useState<SimulatorState>({
    ...DEFAULT,
    productCostPct: brand?.product_cost_pct ?? 12,
    guiasPct: brand?.commission_affiliates ?? 6,
    ttCommissionPct: brand?.commission_tiktok ?? 8,
    ivaAdsPct: brand?.iva_ads_pct ?? 16,
  });

  const update = useCallback(
    <K extends keyof SimulatorState>(key: K, value: SimulatorState[K]) => {
      setS((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const C = useMemo(() => compute(s), [s]);

  const roasTicks = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8];
  const roasColor =
    s.roas >= 3 ? "#22c55e" : s.roas >= 2 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex gap-5 items-start flex-col lg:flex-row">
      {/* ── LEFT COLUMN: INPUTS ── */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 space-y-4">
        {/* BLOQUE 1: GMV */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Ventas del periodo
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
              MX$
            </span>
            <input
              type="number"
              value={s.gmv || ""}
              onChange={(e) => update("gmv", parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-3 text-white text-xl font-bold focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder:text-gray-600"
            />
          </div>
          {s.gmv > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              = {formatMX(s.gmv, true)} en ventas totales del periodo
            </p>
          )}
        </div>

        {/* BLOQUE 2: ROAS SLIDER */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Gasto en Pauta &mdash; ROAS
            </label>
            <span
              className={`text-2xl font-black ${
                s.roas >= 3
                  ? "text-green-400"
                  : s.roas >= 2
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {s.roas.toFixed(1)}x
            </span>
          </div>

          <div className="relative mb-2">
            <style>{`
              .roas-slider {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: linear-gradient(to right,
                  ${roasColor} 0%,
                  ${roasColor} ${((s.roas - 0.5) / 7.5) * 100}%,
                  #30363d ${((s.roas - 0.5) / 7.5) * 100}%,
                  #30363d 100%
                );
                cursor: pointer;
                outline: none;
              }
              .roas-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px; height: 20px;
                border-radius: 50%;
                background: ${roasColor};
                border: 3px solid #161b22;
                box-shadow: 0 0 0 2px ${roasColor}40;
                cursor: pointer;
                transition: box-shadow 0.15s;
              }
              .roas-slider::-webkit-slider-thumb:hover {
                box-shadow: 0 0 0 5px ${roasColor}40;
              }
              .roas-slider::-moz-range-thumb {
                width: 20px; height: 20px;
                border-radius: 50%;
                background: ${roasColor};
                border: 3px solid #161b22;
                cursor: pointer;
              }
              .roas-slider::-moz-range-track {
                height: 6px;
                border-radius: 3px;
                background: #30363d;
              }
            `}</style>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.1"
              value={s.roas}
              onChange={(e) => update("roas", parseFloat(e.target.value))}
              className="roas-slider"
            />
            <div className="flex justify-between mt-1 px-0">
              {roasTicks.map((t) => (
                <button
                  key={t}
                  onClick={() => update("roas", t)}
                  className={`text-xs transition-colors ${
                    Math.abs(s.roas - t) < 0.05
                      ? "text-white font-bold"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {t}x
                </button>
              ))}
            </div>
          </div>

          {s.gmv > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-[#0d1117] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Gasto en Ads</p>
                <p className="text-white font-bold text-sm">
                  {formatMX(s.gmv / s.roas)}
                </p>
                <p className="text-gray-600 text-xs">
                  {pct((1 / s.roas) * 100)} del GMV
                </p>
              </div>
              <div className="bg-[#0d1117] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">IVA sobre Ads</p>
                <p className="text-white font-bold text-sm">
                  {formatMX((s.gmv / s.roas) * (s.ivaAdsPct / 100))}
                </p>
                <p className="text-gray-600 text-xs">
                  {s.ivaAdsPct}% del gasto
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BLOQUE 3: Costos y Comisiones */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
          <button
            onClick={() => update("costsOpen", !s.costsOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#1c2128] transition-colors"
          >
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Costos y Comisiones
            </span>
            <span
              className={`text-gray-500 transition-transform ${
                s.costsOpen ? "rotate-180" : ""
              }`}
            >
              &#9662;
            </span>
          </button>

          {s.costsOpen && (
            <div className="px-5 pb-5 pt-1 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-500">
                    Costo Producto
                  </label>
                  <div className="flex rounded-md bg-[#0d1117] border border-[#30363d] overflow-hidden text-xs">
                    <button
                      onClick={() => update("productCostMode", "pct")}
                      className={`px-2.5 py-1 transition-colors ${
                        s.productCostMode === "pct"
                          ? "bg-orange-500 text-white"
                          : "text-gray-400"
                      }`}
                    >
                      % GMV
                    </button>
                    <button
                      onClick={() => update("productCostMode", "fixed")}
                      className={`px-2.5 py-1 transition-colors ${
                        s.productCostMode === "fixed"
                          ? "bg-orange-500 text-white"
                          : "text-gray-400"
                      }`}
                    >
                      MX$ fijo
                    </button>
                  </div>
                </div>
                {s.productCostMode === "pct" ? (
                  <div className="relative">
                    <input
                      type="number"
                      value={s.productCostPct}
                      onChange={(e) =>
                        update("productCostPct", parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 pr-8 text-white text-sm focus:border-orange-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      %
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      MX$
                    </span>
                    <input
                      type="number"
                      value={s.productCostFixed}
                      onChange={(e) =>
                        update(
                          "productCostFixed",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: "guiasPct", label: "Guias/Afiliados" },
                    { key: "ttCommissionPct", label: "Comision TikTok" },
                    { key: "ivaAdsPct", label: "IVA sobre Ads" },
                    { key: "retencionBasePct", label: "Retenciones ISR" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={s[key]}
                        onChange={(e) =>
                          update(key, parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 pr-7 text-white text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-600 pt-1">
                Los valores por defecto se toman de la configuracion de tu marca
              </p>
            </div>
          )}
        </div>

        {/* BLOQUE 4: Gastos Fijos */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Gastos Fijos del Mes
            </label>
            <span className="text-xs text-gray-600">Opcional</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              MX$
            </span>
            <input
              type="number"
              value={s.fixedCosts || ""}
              onChange={(e) =>
                update("fixedCosts", parseFloat(e.target.value) || 0)
              }
              placeholder="0"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-3 text-white text-base font-semibold focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors placeholder:text-gray-600"
            />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Incluye nomina + operativos + otros. Si lo dejas en 0 veras solo el
            margen bruto.
          </p>
        </div>
      </div>

      {/* ── RIGHT COLUMN: RESULTS ── */}
      <div className="flex-1 min-w-0 space-y-4 w-full">
        {!C ? (
          <div className="flex items-center justify-center h-80 rounded-xl border border-[#30363d] bg-[#161b22]">
            <div className="text-center">
              <div className="text-4xl mb-3">&rarr;</div>
              <p className="text-gray-400 font-medium">
                Ingresa el GMV para ver la simulacion
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Los resultados apareceran aqui en tiempo real
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* TOP METRICS GRID */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-xl border p-4 ${getMarginBg(C.netMarginPct)}`}
              >
                <p className="text-xs text-gray-400 mb-1">
                  {s.fixedCosts > 0 ? "Utilidad Neta" : "Margen Bruto"}
                </p>
                <p
                  className={`text-3xl font-black ${getMarginColor(C.netMarginPct)}`}
                >
                  {formatMX(C.netProfit)}
                </p>
                <p
                  className={`text-sm font-bold mt-0.5 ${getMarginColor(C.netMarginPct)}`}
                >
                  {pct(C.netMarginPct)} del GMV
                </p>
              </div>

              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <p className="text-xs text-gray-400 mb-1">ROAS Simulado</p>
                <p
                  className={`text-3xl font-black ${
                    s.roas >= 3
                      ? "text-green-400"
                      : s.roas >= 2
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {s.roas.toFixed(1)}x
                </p>
                {C.roasBreakEven && C.roasBreakEven > 0 ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Min. para no perder:{" "}
                    <span className="text-white">
                      {C.roasBreakEven.toFixed(2)}x
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sin gastos fijos configurados
                  </p>
                )}
              </div>
            </div>

            {/* BREAK-EVEN BAR */}
            {s.fixedCosts > 0 && C.breakEvenGMV > 0 && (
              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Punto de Equilibrio
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      C.breakEvenDelta >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {C.breakEvenDelta >= 0
                      ? `+${formatMX(C.breakEvenDelta)} arriba`
                      : `${formatMX(C.breakEvenDelta)} abajo`}
                  </p>
                </div>
                <div className="w-full bg-[#0d1117] rounded-full h-3 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      s.gmv >= C.breakEvenGMV ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min((s.gmv / C.breakEvenGMV) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>MX$ 0</span>
                  <span className="text-white">
                    BE: {formatMX(C.breakEvenGMV)}
                  </span>
                  <span
                    className={
                      s.gmv > C.breakEvenGMV * 1.5
                        ? "text-green-400"
                        : "text-gray-500"
                    }
                  >
                    {formatMX(C.breakEvenGMV * 1.5)}
                  </span>
                </div>
              </div>
            )}

            {/* P&L TABLE */}
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
              <div className="px-4 py-3 bg-[#30363d]/40 border-b border-[#30363d]">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Estado de Resultados Simulado
                </p>
              </div>
              <div className="p-4 space-y-0">
                {(
                  [
                    {
                      label: "(+) GMV Bruto",
                      value: s.gmv,
                      pctVal: 100,
                      bold: true,
                      color: "text-white",
                    },
                    {
                      label: `(-) Costo Producto${s.productCostMode === "pct" ? ` (${s.productCostPct}%)` : ""}`,
                      value: -C.productCost,
                      pctVal: -(C.productCost / s.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: `(-) Guias/Afiliados (${s.guiasPct}%)`,
                      value: -C.guias,
                      pctVal: -(C.guias / s.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: `(-) Comision TikTok (${s.ttCommissionPct}%)`,
                      value: -C.ttComm,
                      pctVal: -(C.ttComm / s.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: "(-) Retenciones ISR",
                      value: -C.retenciones,
                      pctVal: -(C.retenciones / s.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: "(-) Gasto en Ads",
                      value: -C.gastoAds,
                      pctVal: -(C.gastoAds / s.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: `(-) IVA sobre Ads (${s.ivaAdsPct}%)`,
                      value: -C.ivaAds,
                      pctVal: -(C.ivaAds / s.gmv) * 100,
                      color: "text-red-400",
                      indent: true,
                    },
                    {
                      label: "= MARGEN BRUTO",
                      value: C.grossMargin,
                      pctVal: C.grossMarginPct,
                      bold: true,
                      divider: true,
                      color:
                        C.grossMargin >= 0 ? "text-green-400" : "text-red-400",
                    },
                    ...(s.fixedCosts > 0
                      ? [
                          {
                            label: "(-) Gastos Fijos del mes",
                            value: -s.fixedCosts,
                            pctVal: -(s.fixedCosts / s.gmv) * 100,
                            color: "text-red-400",
                            indent: true,
                          },
                          {
                            label: "= UTILIDAD NETA",
                            value: C.netProfit,
                            pctVal: C.netMarginPct,
                            bold: true,
                            divider: true,
                            color:
                              C.netProfit >= 0
                                ? "text-green-400"
                                : "text-red-400",
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

            {/* INSIGHT CARD */}
            <div
              className={`rounded-xl border p-4 ${
                C.netMarginPct >= 20
                  ? "bg-green-950/40 border-green-900/50"
                  : C.netMarginPct >= 0
                    ? "bg-amber-950/40 border-amber-900/50"
                    : "bg-red-950/40 border-red-900/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">
                  {C.netMarginPct >= 20
                    ? "OK"
                    : C.netMarginPct >= 0
                      ? "!"
                      : "X"}
                </span>
                <div>
                  <p
                    className={`font-semibold text-sm ${
                      C.netMarginPct >= 20
                        ? "text-green-300"
                        : C.netMarginPct >= 0
                          ? "text-amber-300"
                          : "text-red-300"
                    }`}
                  >
                    {C.netMarginPct >= 20
                      ? "Escenario rentable"
                      : C.netMarginPct >= 0
                        ? "Margen ajustado — revisa costos"
                        : "Escenario en perdida"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    {s.fixedCosts > 0
                      ? C.netProfit >= 0
                        ? `Con ${formatMX(s.gmv)} en ventas a ROAS ${s.roas.toFixed(1)}x, generas ${formatMX(C.netProfit)} de utilidad neta. ${
                            C.breakEvenDelta > 0
                              ? `Estas ${formatMX(C.breakEvenDelta)} por encima del break-even.`
                              : ""
                          }`
                        : `Necesitas vender ${formatMX(C.breakEvenGMV)} para cubrir los gastos fijos. Te faltan ${formatMX(Math.abs(C.breakEvenDelta))} de GMV. ${
                            C.roasBreakEven
                              ? `O subir el ROAS a ${C.roasBreakEven.toFixed(2)}x.`
                              : ""
                          }`
                      : `Con este volumen y ROAS ${s.roas.toFixed(1)}x, tu margen bruto es ${pct(C.grossMarginPct)}. Agrega tus gastos fijos para ver la utilidad neta real.`}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
