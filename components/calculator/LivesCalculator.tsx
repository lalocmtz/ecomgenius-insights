"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMXN, formatPercent } from "@/lib/format";
import { Info } from "lucide-react";
import { type GMVMaxState, computeGMVMax } from "./GMVMaxCalculator";

interface LivesState extends GMVMaxState {
  costoHost: number;
  duracionHoras: number;
  pedidosPorHora: number;
  simMode: "proyectar" | "analizar";
  simGastoAds: number;
}

// --- Sub-components ---

function PillToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-[#0d1117] p-1 text-sm border border-[#30363d]">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`flex-1 rounded-md px-3 py-1.5 transition-colors text-xs font-medium ${
            value === opt.key
              ? "bg-[#f97316] text-white"
              : "text-[#8b949e] hover:text-[#e6edf3]"
          }`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  readOnly,
  info,
}: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  readOnly?: boolean;
  info?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-[#8b949e] text-xs">{label}</Label>
        {info && (
          <div className="group relative">
            <Info className="h-3 w-3 text-[#8b949e] cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-56 rounded-lg bg-[#30363d] p-2 text-xs text-[#e6edf3] z-50 shadow-lg">
              {info}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          step={step}
          value={readOnly ? value.toFixed(2) : value}
          onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
          readOnly={readOnly}
          className={`bg-[#0d1117] border-[#30363d] text-[#e6edf3] ${
            prefix ? "pl-10" : ""
          } ${suffix ? "pr-8" : ""} ${
            readOnly ? "bg-[#161b22] text-[#8b949e] cursor-default" : ""
          }`}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function CostRow({
  label,
  amount,
  pctOfAov,
  highlight,
  bold,
}: {
  label: string;
  amount: number;
  pctOfAov: number;
  highlight?: "green" | "amber" | "red";
  bold?: boolean;
}) {
  const colorMap = {
    green: "text-[#22c55e]",
    amber: "text-[#f97316]",
    red: "text-[#ef4444]",
  };
  const color = highlight ? colorMap[highlight] : "text-[#e6edf3]";
  const weight = bold ? "font-bold" : "font-normal";

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={`text-[#8b949e] ${weight}`}>{label}</span>
      <div className="flex items-center gap-4">
        <span className={`${color} ${weight} w-28 text-right`}>
          {formatMXN(amount)}
        </span>
        <span className="text-[#8b949e] w-16 text-right text-xs">
          {formatPercent(pctOfAov)}
        </span>
      </div>
    </div>
  );
}

function margenColor(pct: number): "green" | "amber" | "red" {
  if (pct > 25) return "green";
  if (pct >= 10) return "amber";
  return "red";
}

function margenBg(c: "green" | "amber" | "red") {
  return c === "green"
    ? "bg-[#22c55e]"
    : c === "amber"
      ? "bg-[#f97316]"
      : "bg-[#ef4444]";
}

function margenText(c: "green" | "amber" | "red") {
  return c === "green"
    ? "text-[#22c55e]"
    : c === "amber"
      ? "text-[#f97316]"
      : "text-[#ef4444]";
}

// --- Main component ---

interface LivesCalculatorProps {
  defaults?: {
    comisionTT?: number;
    guiasPct?: number;
    costoPct?: number;
    ivaAdsPct?: number;
  };
}

export function LivesCalculator({ defaults }: LivesCalculatorProps) {
  const [state, setState] = useState<LivesState>({
    aov: 200,
    pedidos: 1,
    adsMode: "roas",
    roasTarget: 4,
    gastoAdsFixed: 0,
    costoMode: "pct",
    costoPct: defaults?.costoPct ?? 12,
    costoFixed: 0,
    guiasPct: defaults?.guiasPct ?? 6,
    comisionTT: defaults?.comisionTT ?? 8,
    ivaAdsPct: defaults?.ivaAdsPct ?? 16,
    retencionBasePct: 10.5,
    targetUtilidad: 0,
    costoHost: 0,
    duracionHoras: 2,
    pedidosPorHora: 10,
    simMode: "proyectar",
    simGastoAds: 0,
  });

  const set = <K extends keyof LivesState>(key: K, val: LivesState[K]) =>
    setState((prev) => ({ ...prev, [key]: val }));

  // Base GMV Max result (without host)
  const base = useMemo(() => computeGMVMax(state), [state]);

  // Add host cost per unit
  const costoHostUnit = state.pedidos > 0 ? state.costoHost / state.pedidos : 0;
  const totalCostosWithHost = base.totalCostos + costoHostUnit;
  const margenUnit = state.aov - totalCostosWithHost;
  const margenPct = state.aov > 0 ? (margenUnit / state.aov) * 100 : 0;
  const mc = margenColor(margenPct);

  // Live Simulator
  const sim = useMemo(() => {
    const pedidosTotales = state.duracionHoras * state.pedidosPorHora;
    const gmvEstimado = pedidosTotales * state.aov;

    // Per-unit ad cost for the sim
    const simAdsUnit = pedidosTotales > 0 ? state.simGastoAds / pedidosTotales : 0;
    const simIvaAds = simAdsUnit * (state.ivaAdsPct / 100);

    const costoProductoUnit =
      state.costoMode === "pct"
        ? state.aov * (state.costoPct / 100)
        : state.costoFixed;
    const guiasUnit = state.aov * (state.guiasPct / 100);
    const comisionTTUnit = state.aov * (state.comisionTT / 100);
    const baseImponible = state.aov * (1 - state.comisionTT / 100 - state.guiasPct / 100);
    const retencionesUnit = baseImponible * (state.retencionBasePct / 100);

    const costosVarUnit =
      costoProductoUnit +
      guiasUnit +
      simAdsUnit +
      simIvaAds +
      comisionTTUnit +
      retencionesUnit;

    const margenSinHost = state.aov - costosVarUnit;
    const totalCostosSim =
      costosVarUnit * pedidosTotales + state.costoHost;
    const utilidadSim = gmvEstimado - totalCostosSim;
    const margenPctSim = gmvEstimado > 0 ? (utilidadSim / gmvEstimado) * 100 : 0;

    // Break-even
    const pedidosBE =
      margenSinHost > 0 ? Math.ceil(state.costoHost / margenSinHost) : 0;
    const gmvBE = pedidosBE * state.aov;
    const minutosBE =
      state.pedidosPorHora > 0
        ? (pedidosBE / state.pedidosPorHora) * 60
        : 0;

    // ROAS minimo (for sim)
    const fixedCostsUnit =
      costoProductoUnit + guiasUnit + comisionTTUnit + retencionesUnit;
    const aovMinusFixed = state.aov - fixedCostsUnit - (state.costoHost / Math.max(pedidosTotales, 1));
    const roasMinimo =
      aovMinusFixed > 0
        ? (state.aov * (1 + state.ivaAdsPct / 100)) / aovMinusFixed
        : 0;

    // Max ad spend (where margen = 0 with host)
    const margenSinAds =
      state.aov - costoProductoUnit - guiasUnit - comisionTTUnit - retencionesUnit;
    const maxAdSpendPerUnit = margenSinAds / (1 + state.ivaAdsPct / 100);
    const gastoAdsMax =
      maxAdSpendPerUnit > 0
        ? maxAdSpendPerUnit * pedidosTotales - state.costoHost
        : 0;

    const roasSim =
      state.simGastoAds > 0 ? gmvEstimado / state.simGastoAds : 0;

    return {
      pedidosTotales,
      gmvEstimado,
      totalCostosSim,
      utilidadSim,
      margenPctSim,
      pedidosBE,
      gmvBE,
      minutosBE,
      roasMinimo,
      gastoAdsMax: Math.max(0, gastoAdsMax),
      roasSim,
    };
  }, [state]);

  const simMc = margenColor(sim.margenPctSim);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Inputs */}
        <div className="space-y-4">
          {/* Block 1: Datos de Venta + Host */}
          <Card className="bg-[#1c2128] border-[#30363d] ring-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#e6edf3] text-base">
                Datos de Venta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <NumInput
                  label="AOV / Ticket Promedio"
                  value={state.aov}
                  onChange={(v) => set("aov", v)}
                  prefix="MX$"
                  step={10}
                />
                <NumInput
                  label="Pedidos"
                  value={state.pedidos}
                  onChange={(v) => set("pedidos", Math.max(1, v))}
                  step={1}
                />
              </div>
              <NumInput
                label="Costo del Host"
                value={state.costoHost}
                onChange={(v) => set("costoHost", v)}
                prefix="MX$"
                step={50}
              />
              {state.costoHost > 0 && (
                <NumInput
                  label="Costo Host por pedido"
                  value={costoHostUnit}
                  prefix="MX$"
                  readOnly
                />
              )}
              <NumInput
                label="Venta Total"
                value={base.ventaTotal}
                prefix="MX$"
                readOnly
              />
            </CardContent>
          </Card>

          {/* Block 2: Gasto en Ads */}
          <Card className="bg-[#1c2128] border-[#30363d] ring-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#e6edf3] text-base">
                Gasto en Ads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PillToggle
                value={state.adsMode}
                options={[
                  { key: "roas", label: "ROAS objetivo" },
                  { key: "fixed", label: "Gasto fijo" },
                ]}
                onChange={(k) => set("adsMode", k as "roas" | "fixed")}
              />
              {state.adsMode === "roas" ? (
                <>
                  <NumInput
                    label="ROAS objetivo"
                    value={state.roasTarget}
                    onChange={(v) => set("roasTarget", v)}
                    step={0.1}
                    suffix="x"
                  />
                  <NumInput
                    label="Gasto Ads calculado"
                    value={base.gastoAdsUnit}
                    prefix="MX$"
                    readOnly
                  />
                </>
              ) : (
                <>
                  <NumInput
                    label="Gasto Ads total"
                    value={state.gastoAdsFixed}
                    onChange={(v) => set("gastoAdsFixed", v)}
                    prefix="MX$"
                    step={100}
                  />
                  <NumInput
                    label="ROAS implicito"
                    value={base.roasActual}
                    suffix="x"
                    readOnly
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Block 3: Costo de Producto */}
          <Card className="bg-[#1c2128] border-[#30363d] ring-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#e6edf3] text-base">
                Costo de Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PillToggle
                value={state.costoMode}
                options={[
                  { key: "pct", label: "% del AOV" },
                  { key: "fixed", label: "Monto fijo MX$" },
                ]}
                onChange={(k) => set("costoMode", k as "pct" | "fixed")}
              />
              {state.costoMode === "pct" ? (
                <>
                  <NumInput
                    label="% Costo Producto"
                    value={state.costoPct}
                    onChange={(v) => set("costoPct", v)}
                    suffix="%"
                    step={0.5}
                  />
                  <NumInput
                    label="Costo por pieza"
                    value={base.costoProducto}
                    prefix="MX$"
                    readOnly
                  />
                </>
              ) : (
                <>
                  <NumInput
                    label="Costo por pieza"
                    value={state.costoFixed}
                    onChange={(v) => set("costoFixed", v)}
                    prefix="MX$"
                    step={1}
                  />
                  <NumInput
                    label="% del AOV"
                    value={
                      state.aov > 0
                        ? (state.costoFixed / state.aov) * 100
                        : 0
                    }
                    suffix="%"
                    readOnly
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Block 4: Comisiones y Retenciones */}
          <Card className="bg-[#1c2128] border-[#30363d] ring-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#e6edf3] text-base">
                Comisiones y Retenciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <NumInput
                  label="Guias / Afiliados"
                  value={state.guiasPct}
                  onChange={(v) => set("guiasPct", v)}
                  suffix="%"
                  step={0.5}
                />
                <NumInput
                  label="Comision TikTok"
                  value={state.comisionTT}
                  onChange={(v) => set("comisionTT", v)}
                  suffix="%"
                  step={0.5}
                />
                <NumInput
                  label="IVA sobre Ads"
                  value={state.ivaAdsPct}
                  onChange={(v) => set("ivaAdsPct", v)}
                  suffix="%"
                  step={1}
                  info="Se aplica sobre el gasto publicitario, no sobre la venta"
                />
                <NumInput
                  label="Retenciones ISR (sobre base)"
                  value={state.retencionBasePct}
                  onChange={(v) => set("retencionBasePct", v)}
                  suffix="%"
                  step={0.5}
                  info="Se aplica sobre el monto neto despues de comision TT y guias. Equivale a ~9.03% del AOV."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Results */}
        <div className="space-y-4">
          {/* Semaforo */}
          <Card className="bg-[#1c2128] border-[#30363d] ring-0">
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full ${margenBg(mc)} shadow-lg`} />
                <div>
                  <p className="text-xs text-[#8b949e]">Margen de Utilidad</p>
                  <p className={`text-2xl font-bold ${margenText(mc)}`}>
                    {formatPercent(margenPct)}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-[#8b949e]">Utilidad por unidad</p>
                  <p
                    className={`text-xl font-bold ${margenUnit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                  >
                    {formatMXN(margenUnit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metricas clave */}
          <Card className="bg-[#1c2128] border-[#30363d] ring-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#e6edf3] text-base">
                Metricas Clave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between py-1.5 text-sm border-b border-[#30363d]">
                <span className="text-[#8b949e]">AOV</span>
                <span className="text-[#e6edf3] font-semibold">
                  {formatMXN(state.aov)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-sm border-b border-[#30363d]">
                <span className="text-[#8b949e]">ROAS actual</span>
                <span className="text-[#f97316] font-semibold">
                  {base.roasActual.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-sm border-b border-[#30363d]">
                <span className="text-[#8b949e]">
                  ROAS break-even{" "}
                  <span className="text-xs">(minimo para no perder)</span>
                </span>
                <span className="text-[#e6edf3] font-semibold">
                  {base.roasBreakEven.toFixed(2)}x
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Desglose de costos */}
          <Card className="bg-[#1c2128] border-[#30363d] ring-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#e6edf3] text-base">
                Desglose de Costos por Unidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CostRow
                label="Base para impuestos"
                amount={base.baseImponible}
                pctOfAov={
                  state.aov > 0
                    ? (base.baseImponible / state.aov) * 100
                    : 0
                }
              />
              <div className="border-t border-[#30363d] my-1" />
              <CostRow
                label="Costo Producto"
                amount={base.costoProducto}
                pctOfAov={
                  state.aov > 0
                    ? (base.costoProducto / state.aov) * 100
                    : 0
                }
              />
              <CostRow
                label={`Guias / Afiliados (${state.guiasPct}%)`}
                amount={base.guias}
                pctOfAov={state.guiasPct}
              />
              <CostRow
                label="Inversion Publicitaria"
                amount={base.gastoAdsUnit}
                pctOfAov={
                  state.aov > 0
                    ? (base.gastoAdsUnit / state.aov) * 100
                    : 0
                }
              />
              <CostRow
                label={`IVA sobre Ads (${state.ivaAdsPct}%)`}
                amount={base.ivaAds}
                pctOfAov={
                  state.aov > 0 ? (base.ivaAds / state.aov) * 100 : 0
                }
              />
              <CostRow
                label={`Comision TikTok (${state.comisionTT}%)`}
                amount={base.comisionTT}
                pctOfAov={state.comisionTT}
              />
              <CostRow
                label={`Retenciones ISR (${state.retencionBasePct}% base)`}
                amount={base.retenciones}
                pctOfAov={
                  state.aov > 0
                    ? (base.retenciones / state.aov) * 100
                    : 0
                }
              />
              {state.costoHost > 0 && (
                <CostRow
                  label="Costo Host (/ pedidos)"
                  amount={costoHostUnit}
                  pctOfAov={
                    state.aov > 0 ? (costoHostUnit / state.aov) * 100 : 0
                  }
                />
              )}
              <div className="border-t-2 border-[#30363d] my-1" />
              <CostRow
                label="TOTAL COSTOS"
                amount={totalCostosWithHost}
                pctOfAov={
                  state.aov > 0
                    ? (totalCostosWithHost / state.aov) * 100
                    : 0
                }
                bold
              />
              <div className="border-t-2 border-[#30363d] my-1" />
              <CostRow
                label="MARGEN"
                amount={margenUnit}
                pctOfAov={margenPct}
                highlight={mc}
                bold
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* LIVE SIMULATOR */}
      <Card className="bg-[#1c2128] border-[#30363d] ring-0">
        <CardHeader>
          <CardTitle className="text-[#e6edf3]">Simulador de Live</CardTitle>
          <p className="text-xs text-[#8b949e] mt-1">
            {state.simMode === "proyectar"
              ? "Proyecta la rentabilidad de un live antes de ejecutarlo."
              : "Analiza la rentabilidad de un live ya realizado."}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <PillToggle
            value={state.simMode}
            options={[
              { key: "proyectar", label: "Proyectar Live" },
              { key: "analizar", label: "Analizar Live ejecutado" },
            ]}
            onChange={(k) =>
              set("simMode", k as "proyectar" | "analizar")
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sim Inputs */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <NumInput
                  label="Duracion del live (horas)"
                  value={state.duracionHoras}
                  onChange={(v) => set("duracionHoras", Math.max(0.5, v))}
                  step={0.5}
                  suffix="hrs"
                />
                <NumInput
                  label="Pedidos promedio por hora"
                  value={state.pedidosPorHora}
                  onChange={(v) => set("pedidosPorHora", v)}
                  step={1}
                />
              </div>
              <NumInput
                label="Pedidos totales estimados"
                value={sim.pedidosTotales}
                readOnly
              />
              <NumInput
                label="AOV esperado"
                value={state.aov}
                onChange={(v) => set("aov", v)}
                prefix="MX$"
                step={10}
              />
              <NumInput
                label="Costo del Host"
                value={state.costoHost}
                onChange={(v) => set("costoHost", v)}
                prefix="MX$"
                step={50}
              />
              <NumInput
                label="Gasto en Ads del Live"
                value={state.simGastoAds}
                onChange={(v) => set("simGastoAds", v)}
                prefix="MX$"
                step={100}
              />
              {state.simGastoAds > 0 && (
                <NumInput
                  label="ROAS implicito"
                  value={sim.roasSim}
                  suffix="x"
                  readOnly
                />
              )}
            </div>

            {/* Sim Results */}
            <div className="space-y-4">
              {/* Proyeccion */}
              <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[#e6edf3]">
                  {state.simMode === "proyectar"
                    ? "Proyeccion del Live"
                    : "Resultado del Live"}
                </h4>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Pedidos estimados</span>
                  <span className="text-[#e6edf3] font-semibold">
                    {sim.pedidosTotales.toLocaleString("es-MX")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">GMV estimado</span>
                  <span className="text-[#e6edf3] font-semibold">
                    {formatMXN(sim.gmvEstimado)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Total Costos</span>
                  <span className="text-[#e6edf3] font-semibold">
                    {formatMXN(sim.totalCostosSim)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-[#30363d] pt-2">
                  <span className="text-[#8b949e] font-semibold">
                    Utilidad estimada
                  </span>
                  <span
                    className={`font-bold ${margenText(simMc)}`}
                  >
                    {formatMXN(sim.utilidadSim)}{" "}
                    <span className="text-xs">
                      ({formatPercent(sim.margenPctSim)})
                    </span>
                  </span>
                </div>
              </div>

              {/* Break-even */}
              <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[#e6edf3]">
                  Break-Even
                </h4>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Pedidos minimos</span>
                  <span className="text-[#f97316] font-bold">
                    {sim.pedidosBE} pedidos
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">GMV minimo</span>
                  <span className="text-[#e6edf3] font-semibold">
                    {formatMXN(sim.gmvBE)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">
                    Minutos para break-even
                  </span>
                  <span className="text-[#e6edf3] font-semibold">
                    {sim.minutosBE.toFixed(0)} min
                  </span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Asumiendo ritmo de {state.pedidosPorHora} pedidos/hr
                </p>
              </div>

              {/* Limites */}
              <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[#e6edf3]">
                  Limites
                </h4>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">ROAS minimo</span>
                  <span className="text-[#e6edf3] font-semibold">
                    {sim.roasMinimo.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Gasto Ads maximo</span>
                  <span className="text-[#e6edf3] font-semibold">
                    {formatMXN(sim.gastoAdsMax)}
                  </span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Maximo que puedes gastar y seguir en verde
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
