"use client";

import { use, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Play, TrendingUp, Award, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatMXN, formatNumber, formatPercent } from "@/lib/format";
import { useDateRange } from "@/hooks/use-date-range";
import { KPICard } from "@/components/dashboard/KPICard";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import type { Creative, VideoPerformance } from "@/types";

type SortKey = keyof Creative;
type SortDir = "asc" | "desc";

export default function CreativesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { dateRange } = useDateRange();

  const [brandId, setBrandId] = useState<string | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [videoPerf, setVideoPerf] = useState<VideoPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("roi");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const from = format(dateRange.start, "yyyy-MM-dd");
  const to = format(dateRange.end, "yyyy-MM-dd");

  useEffect(() => {
    async function fetchBrand() {
      const { data } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", slug)
        .single();
      if (data) setBrandId(data.id);
    }
    fetchBrand();
  }, [slug]);

  useEffect(() => {
    if (!brandId) return;

    async function fetchData() {
      setLoading(true);

      const [creativesRes, videoPerfRes] = await Promise.all([
        supabase
          .from("creatives")
          .select("*")
          .eq("brand_id", brandId)
          .lte("period_start", to)
          .gte("period_end", from),
        supabase
          .from("video_performance")
          .select("*")
          .eq("brand_id", brandId)
          .gte("date", from)
          .lte("date", to)
          .order("date", { ascending: true }),
      ]);

      setCreatives(creativesRes.data ?? []);
      setVideoPerf(videoPerfRes.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [brandId, from, to]);

  const kpis = useMemo(() => {
    if (creatives.length === 0) {
      return { total: 0, avgRoi: 0, bestTitle: "-", bestRoi: 0, avg2s: 0, avg6s: 0 };
    }

    const avgRoi = creatives.reduce((s, c) => s + c.roi, 0) / creatives.length;
    const best = creatives.reduce((a, b) => (b.roi > a.roi ? b : a), creatives[0]);
    const avg2s = creatives.reduce((s, c) => s + c.view_rate_2s, 0) / creatives.length;
    const avg6s = creatives.reduce((s, c) => s + c.view_rate_6s, 0) / creatives.length;

    return {
      total: creatives.length,
      avgRoi,
      bestTitle: best.video_title,
      bestRoi: best.roi,
      avg2s,
      avg6s,
    };
  }, [creatives]);

  const videoSummary = useMemo(() => {
    const totalVV = videoPerf.reduce((s, v) => s + v.video_views, 0);
    const totalGMV = videoPerf.reduce((s, v) => s + v.gmv_video, 0);
    const avgGPM = videoPerf.length > 0
      ? videoPerf.reduce((s, v) => s + v.gpm, 0) / videoPerf.length
      : 0;
    return { totalVV, totalGMV, avgGPM };
  }, [videoPerf]);

  const sorted = useMemo(() => {
    return [...creatives].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [creatives, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function roiColor(roi: number): string {
    if (roi >= 3) return "text-[#22c55e]";
    if (roi >= 1) return "text-amber-400";
    return "text-[#ef4444]";
  }

  function SortHeader({ label, field }: { label: string; field: SortKey }) {
    const active = sortKey === field;
    return (
      <th
        className="cursor-pointer whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-[#8b949e] hover:text-[#e6edf3]"
        onClick={() => handleSort(field)}
      >
        {label}
        {active && (
          <span className="ml-1">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
        )}
      </th>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#e6edf3]">Creativos</h1>
          <DateRangePicker />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
        <div className="h-96 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
      </div>
    );
  }

  if (creatives.length === 0 && videoPerf.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#e6edf3]">Creativos</h1>
          <DateRangePicker />
        </div>
        <div className="flex h-64 items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128]">
          <p className="text-[#8b949e]">
            No hay datos de creativos para el periodo seleccionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Creativos</h1>
        <DateRangePicker />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Videos"
          value={formatNumber(kpis.total)}
          icon={Play}
        />
        <KPICard
          title="Avg ROI"
          value={`${kpis.avgRoi.toFixed(2)}x`}
          icon={TrendingUp}
        />
        <KPICard
          title="Mejor Video"
          value={
            kpis.bestTitle.length > 30
              ? kpis.bestTitle.slice(0, 30) + "..."
              : kpis.bestTitle
          }
          subtitle={`ROI: ${kpis.bestRoi.toFixed(2)}x`}
          icon={Award}
        />
        <KPICard
          title="Avg View Rates"
          value={`2s: ${formatPercent(kpis.avg2s)}`}
          subtitle={`6s: ${formatPercent(kpis.avg6s)}`}
          icon={Eye}
        />
      </div>

      {/* Creatives Performance Table */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128] overflow-hidden">
        <div className="border-b border-[#30363d] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#e6edf3]">
            Performance de Creativos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#30363d] bg-[#161b22]">
              <tr>
                <SortHeader label="Video" field="video_title" />
                <SortHeader label="Cuenta" field="tiktok_account" />
                <SortHeader label="Status" field="status" />
                <SortHeader label="Costo" field="cost" />
                <SortHeader label="ROI" field="roi" />
                <SortHeader label="Pedidos" field="sku_orders" />
                <SortHeader label="Revenue" field="gross_revenue" />
                <SortHeader label="Impresiones" field="impressions" />
                <SortHeader label="Click Rate" field="click_rate" />
                <SortHeader label="Conv. Rate" field="ad_conversion_rate" />
                <SortHeader label="2s%" field="view_rate_2s" />
                <SortHeader label="6s%" field="view_rate_6s" />
                <SortHeader label="25%" field="view_rate_25" />
                <SortHeader label="50%" field="view_rate_50" />
                <SortHeader label="75%" field="view_rate_75" />
                <SortHeader label="100%" field="view_rate_100" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {sorted.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#161b22] transition-colors"
                >
                  <td className="max-w-[200px] truncate px-3 py-2 text-[#e6edf3]">
                    {c.video_title}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {c.tiktok_account}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === "Active"
                          ? "bg-[#22c55e]/10 text-[#22c55e]"
                          : "bg-[#8b949e]/10 text-[#8b949e]"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatMXN(c.cost)}
                  </td>
                  <td className={`px-3 py-2 font-semibold ${roiColor(c.roi)}`}>
                    {c.roi.toFixed(2)}x
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatNumber(c.sku_orders)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatMXN(c.gross_revenue)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatNumber(c.impressions)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatPercent(c.click_rate)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatPercent(c.ad_conversion_rate)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatPercent(c.view_rate_2s)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatPercent(c.view_rate_6s)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatPercent(c.view_rate_25)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatPercent(c.view_rate_50)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatPercent(c.view_rate_75)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatPercent(c.view_rate_100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video Performance Section */}
      {videoPerf.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e6edf3]">
            Video Performance
          </h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <KPICard
              title="Total Video Views"
              value={formatNumber(videoSummary.totalVV)}
            />
            <KPICard
              title="Total Video GMV"
              value={formatMXN(videoSummary.totalGMV)}
            />
            <KPICard
              title="Avg GPM"
              value={formatMXN(videoSummary.avgGPM)}
            />
          </div>

          {/* GMV Video (bar) + Video Views (line) */}
          <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
            <h3 className="mb-4 text-sm font-medium text-[#8b949e]">
              GMV Video y Video Views Diarios
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={videoPerf}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#30363d"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8b949e", fontSize: 12 }}
                  tickFormatter={(d: string) => format(new Date(d), "dd/MM")}
                  stroke="#30363d"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#8b949e", fontSize: 12 }}
                  stroke="#30363d"
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                  }
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#8b949e", fontSize: 12 }}
                  stroke="#30363d"
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c2128",
                    border: "1px solid #30363d",
                    borderRadius: "8px",
                    color: "#e6edf3",
                  }}
                  formatter={(value: unknown, name: unknown) => [
                    name === "GMV Video"
                      ? formatMXN(Number(value))
                      : formatNumber(Number(value)),
                    String(name),
                  ]}
                  labelFormatter={(label: unknown) =>
                    format(new Date(String(label)), "dd MMM yyyy")
                  }
                />
                <Legend
                  wrapperStyle={{ color: "#8b949e", fontSize: "12px" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="gmv_video"
                  name="GMV Video"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  yAxisId="right"
                  dataKey="video_views"
                  name="Video Views"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Daily GPM Trend */}
          <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
            <h3 className="mb-4 text-sm font-medium text-[#8b949e]">
              GPM Diario
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={videoPerf}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#30363d"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8b949e", fontSize: 12 }}
                  tickFormatter={(d: string) => format(new Date(d), "dd/MM")}
                  stroke="#30363d"
                />
                <YAxis
                  tick={{ fill: "#8b949e", fontSize: 12 }}
                  stroke="#30363d"
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c2128",
                    border: "1px solid #30363d",
                    borderRadius: "8px",
                    color: "#e6edf3",
                  }}
                  formatter={(value: unknown) => [formatMXN(Number(value)), "GPM"]}
                  labelFormatter={(label: unknown) =>
                    format(new Date(String(label)), "dd MMM yyyy")
                  }
                />
                <Line
                  dataKey="gpm"
                  name="GPM"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: "#f97316", r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
