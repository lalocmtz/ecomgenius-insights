"use client";

import { useState, useMemo } from "react";
import { formatMXN, formatPercent } from "@/lib/format";
import { Calculator, TrendingUp, TrendingDown, Target } from "lucide-react";
import type { Brand } from "@/types";

interface Props {
  brand: Brand;
}

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="text-xs text-[#8b949e]">{label}</label>
      <div className="mt-1 flex items-center rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden">
        {prefix && (
          <span className="px-2 text-xs text-[#8b949e] bg-[#161b22] border-r border-[#30363d] py-2">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          step={step ?? 1}
          className="w-full bg-transparent px-3 py-2 text-sm text-[#e6edf3] outline-none"
        />
        {suffix && (
          <span className="px-2 text-xs text-[#8b949e] bg-[#161b22] border-l border-[#30363d] py-2">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  pct,
  bold,
  highlight,
  indent,
  separator,
}: {
  label: string;
  value: number;
  pct?: number;
  bold?: boolean;
  highlight?: "green" | "red" | "orange";
  indent?: boolean;
  separator?: boolean;
}) {
  const colorMap = {
    green: "text-[#22c55e]",
    red: "text-[#ef4444]",
    orange: "text-[#f97316]",
  };
  const color = highlight ? colorMap[highlight] : "text-[#e6edf3]";
  const weight = bold ? "font-bold" : "font-normal";

  return (
    <>
      {separator && <div className="border-t border-[#30363d] my-1" />}
      <div className={`flex items-center justify-between py-1 ${indent ? "pl-4" : ""}`}>
        <span className={`text-sm ${weight} ${indent ? "text-[#8b949e]" : "text-[#e6edf3]"}`}>
          {label}
        </span>
        <div className="flex items-center gap-4">
          <span className={`text-sm ${weight} ${color} w-32 text-right`}>
            {value < 0 ? `(${formatMXN(Math.abs(value))})` : formatMXN(value)}
          </span>
          {pct !== undefined && (
            <span className="text-xs text-[#8b949e] w-14 text-right">
              {pct < 0 ? `-${formatPercent(Math.abs(pct))}` : formatPercent(pct)}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export function SimuladorTab({ brand }: Props) {
  // Ventas
  const [gmv, setGmv] = useState(0);
  const [refunds, setRefunds] = useState(0);
  const [orders, setOrders] = useState(0);

  // Pauta
  const [adSpendProduct, setAdSpendProduct] = useState(0);
  const [adSpendLives, setAdSpendLives] = useState(0);

  // Porcentajes (pre-filled from brand config)
  const [productCostPct, setProductCostPct] = useState(brand.product_cost_pct ?? 12);
  const [commissionTT, setCommissionTT] = useState(brand.commission_tiktok ?? 8);
  const [commissionAff, setCommissionAff] = useState(brand.commission_affiliates ?? 6);
  const [ivaAdsPct, setIvaAdsPct] = useState(brand.iva_ads_pct ?? 16);

  // Gastos fijos del escenario
  const [teamCost, setTeamCost] = useState(0);
  const [opsCost, setOpsCost] = useState(0);

  const results = useMemo(() => {
    const totalAdSpend = adSpendProduct + adSpendLives;
    const ventasNetas = gmv - refunds;
    const aov = orders > 0 ? gmv / orders : 0;

    // Costos variables
    const productCost = gmv * (productCostPct / 100);
    const affiliatesCost = gmv * (commissionAff / 100);
    const ttCommission = gmv * (commissionTT / 100);
    const baseImponible = gmv * (1 - commissionTT / 100 - commissionAff / 100);
    const taxRetention = baseImponible * 0.105;
    const ivaAds = totalAdSpend * (ivaAdsPct / 100);

    const totalVariableCosts =
      productCost + affiliatesCost + ttCommission + taxRetention + totalAdSpend + ivaAds;
    const grossMargin = ventasNetas - totalVariableCosts;
    const grossMarginPct = gmv > 0 ? (grossMargin / gmv) * 100 : 0;

    // Fijos
    const totalFixed = teamCost + opsCost;
    const netProfit = grossMargin - totalFixed;
    const netMarginPct = gmv > 0 ? (netProfit / gmv) * 100 : 0;

    // ROAS
    const roasBlended = totalAdSpend > 0 ? gmv / totalAdSpend : 0;
    const roasProduct = adSpendProduct > 0 ? gmv / adSpendProduct : 0;

    // Break-even
    const breakEvenSales = grossMarginPct > 0 ? totalFixed / (grossMarginPct / 100) : 0;
    const breakEvenOrders = aov > 0 ? Math.ceil(breakEvenSales / aov) : 0;

    // ROAS minimo para no perder
    const costsWithoutAds = refunds + productCost + affiliatesCost + ttCommission + taxRetention + ivaAds + totalFixed;
    const roasMinimo = totalAdSpend > 0 ? (costsWithoutAds + totalAdSpend) / totalAdSpend : 0;

    return {
      totalAdSpend,
      ventasNetas,
      aov,
      productCost,
      affiliatesCost,
      ttCommission,
      taxRetention,
      ivaAds,
      totalVariableCosts,
      grossMargin,
      grossMarginPct,
      totalFixed,
      netProfit,
      netMarginPct,
      roasBlended,
      roasProduct,
      breakEvenSales,
      breakEvenOrders,
      roasMinimo,
    };
  }, [
    gmv, refunds, orders, adSpendProduct, adSpendLives,
    productCostPct, commissionTT, commissionAff, ivaAdsPct,
    teamCost, opsCost,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-6">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="h-6 w-6 text-[#f97316]" />
          <h2 className="text-lg font-bold text-[#e6edf3]">
            Simulador de Escenarios
          </h2>
        </div>
        <p className="text-sm text-[#8b949e]">
          Simula un periodo completo con datos manuales. Ajusta ventas, pauta y
          gastos fijos para evaluar escenarios antes de ejecutar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="space-y-4">
          {/* Ventas */}
          <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#e6edf3]">Ventas del periodo</h3>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="GMV Bruto" value={gmv} onChange={setGmv} prefix="MX$" />
              <InputField label="Reembolsos" value={refunds} onChange={setRefunds} prefix="MX$" />
              <InputField label="Pedidos" value={orders} onChange={setOrders} />
            </div>
          </div>

          {/* Pauta */}
          <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#e6edf3]">Gasto en pauta</h3>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="GMV Max (Product Ads)"
                value={adSpendProduct}
                onChange={setAdSpendProduct}
                prefix="MX$"
              />
              <InputField
                label="Live Shopping Ads"
                value={adSpendLives}
                onChange={setAdSpendLives}
                prefix="MX$"
              />
            </div>
          </div>

          {/* Porcentajes */}
          <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#e6edf3]">Porcentajes de costo</h3>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Costo Producto"
                value={productCostPct}
                onChange={setProductCostPct}
                suffix="%"
                step={0.5}
              />
              <InputField
                label="Comision TikTok"
                value={commissionTT}
                onChange={setCommissionTT}
                suffix="%"
                step={0.5}
              />
              <InputField
                label="Guias/Afiliados"
                value={commissionAff}
                onChange={setCommissionAff}
                suffix="%"
                step={0.5}
              />
              <InputField
                label="IVA sobre Ads"
                value={ivaAdsPct}
                onChange={setIvaAdsPct}
                suffix="%"
                step={0.5}
              />
            </div>
          </div>

          {/* Gastos fijos */}
          <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#e6edf3]">Gastos fijos del mes</h3>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Equipo / Nomina" value={teamCost} onChange={setTeamCost} prefix="MX$" />
              <InputField label="Operativos" value={opsCost} onChange={setOpsCost} prefix="MX$" />
            </div>
            <p className="text-xs text-[#8b949e]">
              Total fijos: {formatMXN(teamCost + opsCost)}/mes
            </p>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
              <p className="text-xs text-[#8b949e]">Utilidad Neta</p>
              <p className={`text-2xl font-bold ${results.netProfit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {formatMXN(results.netProfit)}
              </p>
              <p className="text-xs text-[#8b949e] mt-1">
                Margen: {results.netMarginPct.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
              <p className="text-xs text-[#8b949e]">ROAS Blended</p>
              <p className={`text-2xl font-bold ${results.roasBlended >= 3 ? "text-[#22c55e]" : results.roasBlended >= 1 ? "text-[#f97316]" : "text-[#ef4444]"}`}>
                {results.roasBlended.toFixed(2)}x
              </p>
              <p className="text-xs text-[#8b949e] mt-1">
                Min para no perder: {results.roasMinimo.toFixed(2)}x
              </p>
            </div>
            <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
              <p className="text-xs text-[#8b949e]">Punto de equilibrio</p>
              <p className="text-2xl font-bold text-[#f97316]">
                {formatMXN(results.breakEvenSales)}
              </p>
              <p className="text-xs text-[#8b949e] mt-1">
                {results.breakEvenOrders > 0 ? `~${results.breakEvenOrders} pedidos` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
              <p className="text-xs text-[#8b949e]">Margen Bruto</p>
              <p className={`text-2xl font-bold ${results.grossMarginPct > 25 ? "text-[#22c55e]" : results.grossMarginPct >= 10 ? "text-[#f97316]" : "text-[#ef4444]"}`}>
                {results.grossMarginPct.toFixed(1)}%
              </p>
              <p className="text-xs text-[#8b949e] mt-1">
                {formatMXN(results.grossMargin)}
              </p>
            </div>
          </div>

          {/* Mini P&L */}
          <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
            <h3 className="text-sm font-semibold text-[#e6edf3] mb-3">
              Estado de Resultados Simulado
            </h3>
            <div className="space-y-0">
              <ResultRow label="(+) GMV Bruto" value={gmv} pct={100} bold />
              <ResultRow
                label="(-) Reembolsos"
                value={-refunds}
                pct={gmv > 0 ? -(refunds / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label="= Ventas Netas"
                value={results.ventasNetas}
                pct={gmv > 0 ? (results.ventasNetas / gmv) * 100 : 0}
                bold
                separator
              />

              <ResultRow
                label={`(-) Costo Producto (${productCostPct}%)`}
                value={-results.productCost}
                pct={gmv > 0 ? -(results.productCost / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label={`(-) Guias/Afiliados (${commissionAff}%)`}
                value={-results.affiliatesCost}
                pct={gmv > 0 ? -(results.affiliatesCost / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label={`(-) Comision TikTok (${commissionTT}%)`}
                value={-results.ttCommission}
                pct={gmv > 0 ? -(results.ttCommission / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label="(-) Retenciones ISR"
                value={-results.taxRetention}
                pct={gmv > 0 ? -(results.taxRetention / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label="(-) Gasto Ads"
                value={-results.totalAdSpend}
                pct={gmv > 0 ? -(results.totalAdSpend / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label={`(-) IVA Ads (${ivaAdsPct}%)`}
                value={-results.ivaAds}
                pct={gmv > 0 ? -(results.ivaAds / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label="= MARGEN BRUTO"
                value={results.grossMargin}
                pct={results.grossMarginPct}
                bold
                highlight={results.grossMarginPct > 25 ? "green" : results.grossMarginPct >= 10 ? "orange" : "red"}
                separator
              />

              <ResultRow
                label="(-) Equipo"
                value={-teamCost}
                pct={gmv > 0 ? -(teamCost / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label="(-) Operativos"
                value={-opsCost}
                pct={gmv > 0 ? -(opsCost / gmv) * 100 : 0}
                indent
              />
              <ResultRow
                label="= UTILIDAD NETA"
                value={results.netProfit}
                pct={results.netMarginPct}
                bold
                highlight={results.netProfit > 0 ? "green" : "red"}
                separator
              />
            </div>
          </div>

          {/* Veredicto */}
          {gmv > 0 && (
            <div className={`rounded-xl border p-5 ${
              results.netProfit > 0
                ? "border-[#22c55e]/30 bg-[#22c55e]/5"
                : "border-[#ef4444]/30 bg-[#ef4444]/5"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {results.netProfit > 0 ? (
                  <TrendingUp className="h-5 w-5 text-[#22c55e]" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-[#ef4444]" />
                )}
                <h3 className={`text-sm font-bold ${results.netProfit > 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {results.netProfit > 0 ? "Escenario rentable" : "Escenario con perdida"}
                </h3>
              </div>
              <div className="space-y-1 text-xs text-[#c9d1d9]">
                {results.netProfit > 0 ? (
                  <>
                    <p>
                      Con {formatMXN(gmv)} de venta y {formatMXN(results.totalAdSpend)} de pauta,
                      te quedan {formatMXN(results.netProfit)} de utilidad ({results.netMarginPct.toFixed(1)}%).
                    </p>
                    <p>
                      Tu punto de equilibrio esta en {formatMXN(results.breakEvenSales)}.
                      Estas {formatMXN(gmv - results.breakEvenSales)} por arriba.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Con estos numeros pierdes {formatMXN(Math.abs(results.netProfit))} al mes.
                      Necesitas vender minimo {formatMXN(results.breakEvenSales)} para empatar.
                    </p>
                    <p>
                      Te faltan {formatMXN(results.breakEvenSales - gmv)} en ventas, o reducir
                      costos fijos en {formatMXN(Math.abs(results.netProfit))}.
                    </p>
                    {results.roasMinimo > 0 && (
                      <p>
                        ROAS minimo necesario: {results.roasMinimo.toFixed(2)}x (actual: {results.roasBlended.toFixed(2)}x).
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
