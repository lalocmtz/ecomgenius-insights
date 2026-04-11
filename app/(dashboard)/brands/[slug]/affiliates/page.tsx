"use client";

import { use, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Percent,
  Play,
  Radio,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatMXN, formatNumber } from "@/lib/format";
import { useDateRange } from "@/hooks/use-date-range";
import { KPICard } from "@/components/dashboard/KPICard";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import type { AffiliateMetrics, Creator } from "@/types";

export default function AffiliatesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { dateRange } = useDateRange();

  const [metrics, setMetrics] = useState<AffiliateMetrics[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  const from = format(dateRange.start, "yyyy-MM-dd");
  const to = format(dateRange.end, "yyyy-MM-dd");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [metricsRes, creatorsRes] = await Promise.all([
        supabase
          .from("affiliate_metrics")
          .select("*")
          .eq("brand_id", slug)
          .gte("period_start", from)
          .lte("period_end", to),
        supabase
          .from("creators")
          .select("*")
          .eq("brand_id", slug)
          .gte("period_start", from)
          .lte("period_end", to)
          .order("gmv", { ascending: false }),
      ]);

      setMetrics(metricsRes.data ?? []);
      setCreators(creatorsRes.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [slug, from, to]);

  const summary = useMemo(() => {
    if (metrics.length === 0) {
      return {
        gmv: 0,
        orders: 0,
        aov: 0,
        commission: 0,
        videos: 0,
        lives: 0,
        samples: 0,
      };
    }

    const gmv = metrics.reduce((s, m) => s + m.gmv_affiliates, 0);
    const orders = metrics.reduce(
      (s, m) => s + (m.affiliate_items_sold ?? 0),
      0
    );
    const aov =
      metrics.reduce((s, m) => s + m.aov, 0) / metrics.length;
    const commission = metrics.reduce(
      (s, m) => s + m.estimated_commission,
      0
    );
    const videos = metrics.reduce((s, m) => s + m.videos, 0);
    const lives = metrics.reduce((s, m) => s + m.live_streams, 0);
    const samples = metrics.reduce((s, m) => s + m.samples_sent, 0);

    return { gmv, orders, aov, commission, videos, lives, samples };
  }, [metrics]);

  function rankBadge(index: number): string {
    if (index === 0) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    if (index === 1) return "bg-gray-400/20 text-gray-300 border-gray-400/30";
    if (index === 2) return "bg-amber-700/20 text-amber-500 border-amber-700/30";
    return "bg-[#161b22] text-[#8b949e] border-[#30363d]";
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#e6edf3]">Afiliados</h1>
          <DateRangePicker />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]"
            />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
      </div>
    );
  }

  if (metrics.length === 0 && creators.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#e6edf3]">Afiliados</h1>
          <DateRangePicker />
        </div>
        <div className="flex h-64 items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128]">
          <p className="text-[#8b949e]">
            No hay datos de afiliados para el periodo seleccionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Afiliados</h1>
        <DateRangePicker />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="GMV Afiliados"
          value={formatMXN(summary.gmv)}
          icon={DollarSign}
        />
        <KPICard
          title="Pedidos Atribuidos"
          value={formatNumber(summary.orders)}
          icon={ShoppingCart}
        />
        <KPICard
          title="AOV Afiliados"
          value={formatMXN(summary.aov)}
          icon={TrendingUp}
        />
        <KPICard
          title="Comision Estimada"
          value={formatMXN(summary.commission)}
          icon={Percent}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Videos Activos"
          value={formatNumber(summary.videos)}
          icon={Play}
        />
        <KPICard
          title="Lives Activos"
          value={formatNumber(summary.lives)}
          icon={Radio}
        />
        <KPICard
          title="Muestras Enviadas"
          value={formatNumber(summary.samples)}
          icon={Package}
        />
      </div>

      {/* Top Creators Table */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128] overflow-hidden">
        <div className="border-b border-[#30363d] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#e6edf3]">
            Top Creadores
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#30363d] bg-[#161b22]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Creador
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  GMV
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Pedidos
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  AOV
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Videos
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Lives
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Comision Est.
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Muestras
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {creators.map((c, i) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#161b22] transition-colors"
                >
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${rankBadge(i)}`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium text-[#e6edf3]">
                    {c.creator_name}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatMXN(c.gmv)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatNumber(c.attributed_orders)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatMXN(c.aov)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatNumber(c.videos)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatNumber(c.live_streams)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatMXN(c.estimated_commission)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatNumber(c.samples_sent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
