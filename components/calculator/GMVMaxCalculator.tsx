"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMXN, formatPercent } from "@/lib/format";
import { Info } from "lucide-react";

// --- Shared types & helpers ---

export interface GMVMaxState {
  aov: number;
  pedidos: number;
  adsMode: "roas" | "fixed";
  roasTarget: number;
  gastoAdsFixed: number;
  costoMode: "pct" | "fixed";
  costoPct: number;
  costoFixed: number;
  guiasPct: number;
  comisionTT: number;
  ivaAdsPct: number;
  retencionBasePct: number;
  targetUtilidad: number;
}

export interface GMVMaxResult {
  gastoAdsUnit: number;
  costoProducto: number;
  baseImponible: number;
  guias: number;
  comisionTT: number;
  retenciones: number;
  ivaAds: number;
  totalCostos: number;
  margenUnit: number;
  margenPct: number;
  roasBreakEven: number;
  roasActual: number;
  ventaTotal: number;
  pedidosTarget: number | null;
}

export function computeGMVMax(s: GMVMaxState): GMVMaxResult {
  const gastoAdsUnit =
    s.adsMode === "roas"
      ? s.roasTarget > 0
        ? s.aov / s.roasTarget
        : 0
      : s.pedidos > 0
        ? s.gastoAdsFixed / s.pedidos
        : 0;

  const costoProducto =
    s.costoMode === "pct" ? s.aov * (s.costoPct / 100) : s.costoFixed;

  const baseImponible = s.aov * (1 - s.comisionTT / 100 - s.guiasPct / 100);
  const guias = s.aov * (s.guiasPct / 100);
  const comisionTT = s.aov * (s.comisionTT / 100);
  const retenciones = baseImponible * (s.retencionBasePct / 100);
  const ivaAds = gastoAdsUnit * (s.ivaAdsPct / 100);

  const totalCostos =
    costoProducto + guias + gastoAdsUnit + ivaAds + comisionTT + retenciones;
  const margenUnit = s.aov - totalCostos;
  const margenPct = s.aov > 0 ? (margenUnit / s.aov) * 100 : 0;

  const fixedCosts = costoProducto + guias + comisionTT + retenciones;
  const roasBreakEven =
    s.aov - fixedCosts > 0
      ? (s.aov * (1 + s.ivaAdsPct / 100)) / (s.aov - fixedCosts)
      : 0;

  const ventaTotal = s.aov * s.pedidos;
  const totalAdsSpend =
    s.adsMode === "roas" ? gastoAdsUnit * s.pedidos : s.gastoAdsFixed;
  const roasActual = totalAdsSpend > 0 ? ventaTotal / totalAdsSpend : 0;

  let pedidosTarget: number | null = null;
  if (s.targetUtilidad > 0 && margenUnit > 0) {
    pedidosTarget = Math.ceil(s.targetUtilidad / margenUnit);
  }

  return {
    gastoAdsUnit,
    costoProducto,
    baseImponible,
    guias,
    comisionTT,
    retenciones,
    ivaAds,
    totalCostos,
    margenUnit,
    margenPct,
    roasBreakEven,
    roasActual,
    ventaTotal,
    pedidosTarget,
  };
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
            readOnly
              ? "bg-[#161b22] text-[#8b949e] cursor-default"
              : ""
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

interface GMVMaxCalculatorProps {
  defaults?: {
    comisionTT?: number;
    guiasPct?: number;
    costoPct?: number;
    ivaAdsPct?: number;
  };
}

export function GMVMaxCalculator({ defaults }: GMVMaxCalculatorProps) {
  const [state, setState] = useState<GMVMaxState>({
    aov: 349,
    pedidos: 1,
    adsMode: "roas",
    roasTarget: 3,
    gastoAdsFixed: 0,
    costoMode: "pct",
    costoPct: defaults?.costoPct ?? 12,
    costoFixed: 0,
    guiasPct: defaults?.guiasPct ?? 6,
    comisionTT: defaults?.comisionTT ?? 8,
    ivaAdsPct: defaults?.ivaAdsPct ?? 16,
    retencionBasePct: 10.5,
    targetUtilidad: 0,
  });

  const set = <K extends keyof GMVMaxState>(key: K, val: GMVMaxState[K]) =>
    setState((prev) => ({ ...prev, [key]: val }));

  const r = useMemo(() => computeGMVMax(state), [state]);
  const mc = margenColor(r.margenPct);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT — Inputs */}
      <div className="space-y-4">
        {/* Block 1: Datos de Venta */}
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
              label="Venta Total"
              value={r.ventaTotal}
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
                  value={r.gastoAdsUnit}
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
                  value={r.roasActual}
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
                  value={r.costoProducto}
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
                  value={state.aov > 0 ? (state.costoFixed / state.aov) * 100 : 0}
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
              <div
                className={`w-5 h-5 rounded-full ${margenBg(mc)} shadow-lg shadow-${mc === "green" ? "[#22c55e]/20" : mc === "amber" ? "[#f97316]/20" : "[#ef4444]/20"}`}
              />
              <div>
                <p className="text-xs text-[#8b949e]">Margen de Utilidad</p>
                <p className={`text-2xl font-bold ${margenText(mc)}`}>
                  {formatPercent(r.margenPct)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-[#8b949e]">Utilidad por unidad</p>
                <p
                  className={`text-xl font-bold ${r.margenUnit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                >
                  {formatMXN(r.margenUnit)}
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
                {r.roasActual.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between py-1.5 text-sm border-b border-[#30363d]">
              <span className="text-[#8b949e]">
                ROAS break-even{" "}
                <span className="text-xs">(minimo para no perder)</span>
              </span>
              <span className="text-[#e6edf3] font-semibold">
                {r.roasBreakEven.toFixed(2)}x
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
              amount={r.baseImponible}
              pctOfAov={state.aov > 0 ? (r.baseImponible / state.aov) * 100 : 0}
            />
            <div className="border-t border-[#30363d] my-1" />
            <CostRow
              label="Costo Producto"
              amount={r.costoProducto}
              pctOfAov={state.aov > 0 ? (r.costoProducto / state.aov) * 100 : 0}
            />
            <CostRow
              label={`Guias / Afiliados (${state.guiasPct}%)`}
              amount={r.guias}
              pctOfAov={state.guiasPct}
            />
            <CostRow
              label="Inversion Publicitaria"
              amount={r.gastoAdsUnit}
              pctOfAov={state.aov > 0 ? (r.gastoAdsUnit / state.aov) * 100 : 0}
            />
            <CostRow
              label={`IVA sobre Ads (${state.ivaAdsPct}%)`}
              amount={r.ivaAds}
              pctOfAov={state.aov > 0 ? (r.ivaAds / state.aov) * 100 : 0}
            />
            <CostRow
              label={`Comision TikTok (${state.comisionTT}%)`}
              amount={r.comisionTT}
              pctOfAov={state.comisionTT}
            />
            <CostRow
              label={`Retenciones ISR (${state.retencionBasePct}% base)`}
              amount={r.retenciones}
              pctOfAov={state.aov > 0 ? (r.retenciones / state.aov) * 100 : 0}
            />
            <div className="border-t-2 border-[#30363d] my-1" />
            <CostRow
              label="TOTAL COSTOS"
              amount={r.totalCostos}
              pctOfAov={state.aov > 0 ? (r.totalCostos / state.aov) * 100 : 0}
              bold
            />
            <div className="border-t-2 border-[#30363d] my-1" />
            <CostRow
              label="MARGEN"
              amount={r.margenUnit}
              pctOfAov={r.margenPct}
              highlight={mc}
              bold
            />
          </CardContent>
        </Card>

        {/* Proyeccion por volumen */}
        <Card className="bg-[#1c2128] border-[#30363d] ring-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#e6edf3] text-base">
              Proyeccion por Volumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <NumInput
              label="Utilidad objetivo"
              value={state.targetUtilidad}
              onChange={(v) => set("targetUtilidad", v)}
              prefix="MX$"
              step={1000}
            />
            {r.pedidosTarget !== null && (
              <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Pedidos necesarios</span>
                  <span className="text-[#f97316] font-bold">
                    {r.pedidosTarget.toLocaleString("es-MX")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Venta total necesaria</span>
                  <span className="text-[#e6edf3] font-semibold">
                    {formatMXN(r.pedidosTarget * state.aov)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
