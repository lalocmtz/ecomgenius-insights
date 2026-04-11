"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatMXN, formatPercent } from "@/lib/format";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import type { Brand, TeamMember, FixedCost } from "@/types";

interface Props {
  brandId: string;
  brand: Brand;
}

type Period = "this" | "last" | "3m" | "custom";

function PLRow({
  label,
  amount,
  pct,
  bold,
  highlight,
  indent,
  separator,
}: {
  label: string;
  amount: number;
  pct: number;
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
      <div className={`flex items-center justify-between py-1.5 ${indent ? "pl-4" : ""}`}>
        <span className={`text-sm ${weight} ${indent ? "text-[#8b949e]" : "text-[#e6edf3]"}`}>
          {label}
        </span>
        <div className="flex items-center gap-6">
          <span className={`text-sm ${weight} ${color} w-32 text-right`}>
            {amount < 0 ? `(${formatMXN(Math.abs(amount))})` : formatMXN(amount)}
          </span>
          <span className="text-xs text-[#8b949e] w-16 text-right">
            {pct < 0 ? `-${formatPercent(Math.abs(pct))}` : formatPercent(pct)}
          </span>
        </div>
      </div>
    </>
  );
}

export function PLRealTab({ brandId, brand }: Props) {
  const [period, setPeriod] = useState<Period>("last");
  const [loading, setLoading] = useState(true);

  // Raw data
  const [gmv, setGmv] = useState(0);
  const [refunds, setRefunds] = useState(0);
  const [orders, setOrders] = useState(0);
  const [adSpend, setAdSpend] = useState(0);
  const [teamTotal, setTeamTotal] = useState(0);
  const [opsTotal, setOpsTotal] = useState(0);
  const [daysInPeriod, setDaysInPeriod] = useState(30);

  const dates = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "this":
        start = startOfMonth(now);
        end = now;
        break;
      case "last":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "3m":
        start = startOfMonth(subMonths(now, 3));
        end = endOfMonth(subMonths(now, 1));
        break;
      default:
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
    }

    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
      label: `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`,
      days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    };
  }, [period]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [dailyRes, prodCampRes, liveCampRes, teamRes, costsRes] =
        await Promise.all([
          supabase
            .from("daily_overview")
            .select("gmv, refunds, orders")
            .eq("brand_id", brandId)
            .gte("date", dates.start)
            .lte("date", dates.end),
          supabase
            .from("product_campaigns")
            .select("cost")
            .eq("brand_id", brandId)
            .or(
              `and(period_start.lte.${dates.end},period_end.gte.${dates.start}),period_start.is.null`
            ),
          supabase
            .from("live_campaigns")
            .select("cost")
            .eq("brand_id", brandId)
            .or(
              `and(period_start.lte.${dates.end},period_end.gte.${dates.start}),period_start.is.null`
            ),
          supabase
            .from("team_members")
            .select("cost_monthly")
            .eq("brand_id", brandId)
            .eq("active", true),
          supabase
            .from("fixed_costs")
            .select("amount_monthly")
            .eq("brand_id", brandId)
            .eq("active", true),
        ]);

      const dailyData = dailyRes.data ?? [];
      const totalGmv = dailyData.reduce((s, d) => s + (Number(d.gmv) || 0), 0);
      const totalRefunds = dailyData.reduce((s, d) => s + (Number(d.refunds) || 0), 0);
      const totalOrders = dailyData.reduce((s, d) => s + (Number(d.orders) || 0), 0);

      const prodAdSpend = (prodCampRes.data ?? []).reduce(
        (s, c) => s + (Number(c.cost) || 0),
        0
      );
      const liveAdSpend = (liveCampRes.data ?? []).reduce(
        (s, c) => s + (Number(c.cost) || 0),
        0
      );

      const teamCost = (teamRes.data ?? []).reduce(
        (s, t) => s + (Number(t.cost_monthly) || 0),
        0
      );
      const opsCost = (costsRes.data ?? []).reduce(
        (s, c) => s + (Number(c.amount_monthly) || 0),
        0
      );

      // Prorate monthly costs by period days / 30
      const monthsInPeriod = dates.days / 30;

      setGmv(totalGmv);
      setRefunds(totalRefunds);
      setOrders(totalOrders);
      setAdSpend(prodAdSpend + liveAdSpend);
      setTeamTotal(teamCost * monthsInPeriod);
      setOpsTotal(opsCost * monthsInPeriod);
      setDaysInPeriod(dates.days);
      setLoading(false);
    }

    loadData();
  }, [brandId, dates]);

  // Computed P&L
  const ventasNetas = gmv - refunds;
  const productCost = gmv * (brand.product_cost_pct / 100);
  const guiasAfiliados = gmv * (brand.commission_affiliates / 100);
  const ttCommission = gmv * (brand.commission_tiktok / 100);
  const baseImponible = gmv * (1 - brand.commission_tiktok / 100 - brand.commission_affiliates / 100);
  const taxRetention = baseImponible * 0.105;
  const ivaAds = adSpend * (brand.iva_ads_pct / 100);

  const totalVariableCosts = productCost + guiasAfiliados + ttCommission + taxRetention + adSpend + ivaAds;
  const grossMargin = ventasNetas - totalVariableCosts;
  const grossMarginPct = gmv > 0 ? (grossMargin / gmv) * 100 : 0;

  const totalFixed = teamTotal + opsTotal;
  const netProfit = grossMargin - totalFixed;
  const netMarginPct = gmv > 0 ? (netProfit / gmv) * 100 : 0;

  // Insight metrics
  const breakEvenSales = grossMarginPct > 0 ? totalFixed / (grossMarginPct / 100) : 0;
  const daysToCoverFixed = gmv > 0 ? Math.ceil((totalFixed / (gmv / daysInPeriod))) : 0;
  const fixedOverSales = gmv > 0 ? (totalFixed / gmv) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-[500px] animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[
          { key: "this" as Period, label: "Este mes" },
          { key: "last" as Period, label: "Ultimo mes" },
          { key: "3m" as Period, label: "Ultimos 3 meses" },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p.key
                ? "bg-[#f97316] text-white"
                : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* P&L Statement */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128] overflow-hidden">
        <div className="border-b border-[#30363d] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#e6edf3]">
                ESTADO DE RESULTADOS — {brand.name}
              </h2>
              <p className="text-xs text-[#8b949e] mt-1">
                Periodo: {dates.label}
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#8b949e]">
              <span>MX$</span>
              <span className="w-16 text-right">%</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-0">
          <PLRow label="(+) GMV Bruto" amount={gmv} pct={100} bold />
          <PLRow label="(-) Reembolsos" amount={-refunds} pct={gmv > 0 ? -(refunds / gmv) * 100 : 0} indent />
          <PLRow label="= Ventas Netas" amount={ventasNetas} pct={gmv > 0 ? (ventasNetas / gmv) * 100 : 0} bold separator />

          <div className="pt-2 pb-1">
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
              Costos Variables
            </span>
          </div>
          <PLRow
            label={`(-) Costo de Producto (${brand.product_cost_pct}%)`}
            amount={-productCost}
            pct={gmv > 0 ? -(productCost / gmv) * 100 : 0}
            indent
          />
          <PLRow
            label={`(-) Guias / Afiliados (${brand.commission_affiliates}%)`}
            amount={-guiasAfiliados}
            pct={gmv > 0 ? -(guiasAfiliados / gmv) * 100 : 0}
            indent
          />
          <PLRow
            label={`(-) Comision TikTok (${brand.commission_tiktok}%)`}
            amount={-ttCommission}
            pct={gmv > 0 ? -(ttCommission / gmv) * 100 : 0}
            indent
          />
          <PLRow
            label="(-) Retenciones ISR"
            amount={-taxRetention}
            pct={gmv > 0 ? -(taxRetention / gmv) * 100 : 0}
            indent
          />
          <PLRow
            label="(-) Gasto Ads"
            amount={-adSpend}
            pct={gmv > 0 ? -(adSpend / gmv) * 100 : 0}
            indent
          />
          <PLRow
            label={`(-) IVA sobre Ads (${brand.iva_ads_pct}%)`}
            amount={-ivaAds}
            pct={gmv > 0 ? -(ivaAds / gmv) * 100 : 0}
            indent
          />
          <PLRow
            label="= MARGEN BRUTO"
            amount={grossMargin}
            pct={grossMarginPct}
            bold
            highlight={grossMarginPct > 25 ? "green" : grossMarginPct >= 10 ? "orange" : "red"}
            separator
          />

          <div className="pt-2 pb-1">
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
              Gastos Fijos
            </span>
          </div>
          <PLRow
            label="(-) Equipo"
            amount={-teamTotal}
            pct={gmv > 0 ? -(teamTotal / gmv) * 100 : 0}
            indent
          />
          <PLRow
            label="(-) Operativos"
            amount={-opsTotal}
            pct={gmv > 0 ? -(opsTotal / gmv) * 100 : 0}
            indent
          />
          <PLRow
            label="= UTILIDAD OPERATIVA (EBITDA)"
            amount={netProfit}
            pct={netMarginPct}
            bold
            highlight={netProfit > 0 ? "green" : "red"}
            separator
          />

          <div className="border-t-2 border-[#30363d] my-2" />
          <PLRow
            label="UTILIDAD NETA"
            amount={netProfit}
            pct={netMarginPct}
            bold
            highlight={netProfit > 0 ? "green" : "red"}
          />
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
          <p className="text-xs text-[#8b949e] mb-1">Punto de equilibrio</p>
          <p className="text-xl font-bold text-[#f97316]">
            {formatMXN(breakEvenSales)}
          </p>
          <p className="text-xs text-[#8b949e] mt-1">en ventas/mes</p>
        </div>
        <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
          <p className="text-xs text-[#8b949e] mb-1">
            Dias para cubrir gastos fijos
          </p>
          <p className="text-xl font-bold text-[#e6edf3]">
            {daysToCoverFixed} dias
          </p>
          <p className="text-xs text-[#8b949e] mt-1">de ventas</p>
        </div>
        <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
          <p className="text-xs text-[#8b949e] mb-1">
            % Gastos fijos / ventas
          </p>
          <p
            className={`text-xl font-bold ${fixedOverSales < 15 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
          >
            {formatPercent(fixedOverSales)}
          </p>
          <p className="text-xs text-[#8b949e] mt-1">
            (objetivo: &lt;15%)
          </p>
        </div>
      </div>
    </div>
  );
}
