"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Eye,
  UserPlus,
  Target,
  ArrowUpDown,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { formatMXN, formatNumber, formatPercent } from "@/lib/format";
import { useDateRange } from "@/hooks/use-date-range";
import { KPICard } from "@/components/dashboard/KPICard";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  Brand,
  ProductCampaign,
  LiveCampaign,
  Creative,
} from "@/types";
import { format } from "date-fns";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function roiColor(roi: number): string {
  if (roi >= 3) return "text-[#22c55e]";
  if (roi >= 1) return "text-amber-400";
  return "text-[#ef4444]";
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() ?? "";
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  if (s.includes("activ") || s === "active" || s === "delivering")
    return <span className={`${base} bg-[#22c55e]/10 text-[#22c55e]`}>{status}</span>;
  if (s.includes("paus"))
    return <span className={`${base} bg-amber-400/10 text-amber-400`}>{status}</span>;
  return <span className={`${base} bg-[#8b949e]/10 text-[#8b949e]`}>{status}</span>;
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                  */
/* -------------------------------------------------------------------------- */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#30363d]/50 ${className}`}
    />
  );
}

function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#30363d] bg-[#1c2128]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#30363d]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-[#30363d]/50">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5 space-y-2"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-28" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                               */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128] py-16 px-6 text-center">
      <div className="mb-4 rounded-full bg-[#161b22] p-4">
        <BarChart className="h-8 w-8 text-[#8b949e]" />
      </div>
      <p className="text-lg font-medium text-[#e6edf3]">
        No hay datos para este periodo
      </p>
      <p className="mt-1 text-sm text-[#8b949e]">
        Ve a <span className="text-[#f97316] font-medium">Subir archivos</span> para cargar tus reportes.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Table header helper                                                       */
/* -------------------------------------------------------------------------- */

function SortableHeader({
  label,
  column,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  column: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  onSort: (col: string) => void;
}) {
  const isActive = currentSort === column;
  return (
    <button
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wider text-[#8b949e] hover:text-[#e6edf3] transition-colors"
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${isActive ? "text-[#f97316]" : "text-[#8b949e]/50"}`}
      />
      {isActive && (
        <span className="text-[10px] text-[#f97316]">
          {currentDir === "asc" ? "^" : "v"}
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom tooltip for charts                                                 */
/* -------------------------------------------------------------------------- */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3 shadow-lg">
      <p className="mb-1 text-xs font-medium text-[#e6edf3]">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatMXN(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main page component                                                       */
/* -------------------------------------------------------------------------- */

type SortDir = "asc" | "desc";

export default function CampaignsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { dateRange } = useDateRange();

  /* State ------------------------------------------------------------------ */
  const [brandId, setBrandId] = useState<string | null>(null);
  const [productCampaigns, setProductCampaigns] = useState<ProductCampaign[]>([]);
  const [liveCampaigns, setLiveCampaigns] = useState<LiveCampaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);

  // Creatives tab state
  const [creativeSortCol, setCreativeSortCol] = useState<string>("roi");
  const [creativeSortDir, setCreativeSortDir] = useState<SortDir>("desc");
  const [creativeTypeFilter, setCreativeTypeFilter] = useState<string>("all");

  /* Fetch brand ID from slug ----------------------------------------------- */
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

  /* Fetch campaign data ---------------------------------------------------- */
  useEffect(() => {
    if (!brandId) return;

    async function fetchData() {
      setLoading(true);
      const from = format(dateRange.start, "yyyy-MM-dd");
      const to = format(dateRange.end, "yyyy-MM-dd");

      const [productRes, liveRes, creativeRes] = await Promise.all([
        supabase
          .from("product_campaigns")
          .select("*")
          .eq("brand_id", brandId)
          .or(`and(period_start.lte.${to},period_end.gte.${from}),period_start.is.null`)
          .order("cost", { ascending: false }),
        supabase
          .from("live_campaigns")
          .select("*")
          .eq("brand_id", brandId)
          .or(`and(period_start.lte.${to},period_end.gte.${from}),period_start.is.null`)
          .order("cost", { ascending: false }),
        supabase
          .from("creatives")
          .select("*")
          .eq("brand_id", brandId)
          .or(`and(period_start.lte.${to},period_end.gte.${from}),period_start.is.null`)
          .order("roi", { ascending: false }),
      ]);

      setProductCampaigns(productRes.data ?? []);
      setLiveCampaigns(liveRes.data ?? []);
      setCreatives(creativeRes.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [brandId, dateRange]);

  /* Computed: Product campaigns summary ------------------------------------ */
  const productSummary = useMemo(() => {
    const totalCost = productCampaigns.reduce((s, c) => s + c.cost, 0);
    const grossRevenue = productCampaigns.reduce((s, c) => s + c.gross_revenue, 0);
    const skuOrders = productCampaigns.reduce((s, c) => s + c.sku_orders, 0);
    const roi = totalCost > 0 ? grossRevenue / totalCost : 0;
    const costPerOrder = skuOrders > 0 ? totalCost / skuOrders : 0;
    return { totalCost, grossRevenue, roi, skuOrders, costPerOrder };
  }, [productCampaigns]);

  /* Computed: Live campaigns summary --------------------------------------- */
  const liveSummary = useMemo(() => {
    const totalCost = liveCampaigns.reduce((s, c) => s + c.cost, 0);
    const revenue = liveCampaigns.reduce((s, c) => s + c.gross_revenue, 0);
    const liveViews = liveCampaigns.reduce((s, c) => s + c.live_views, 0);
    const liveFollows = liveCampaigns.reduce((s, c) => s + c.live_follows, 0);
    const roi = totalCost > 0 ? revenue / totalCost : 0;
    return { totalCost, revenue, roi, liveViews, liveFollows };
  }, [liveCampaigns]);

  /* Computed: Chart data --------------------------------------------------- */
  const productChartData = useMemo(
    () =>
      productCampaigns.map((c) => ({
        name:
          c.campaign_name.length > 20
            ? c.campaign_name.slice(0, 20) + "..."
            : c.campaign_name,
        Costo: c.cost,
        Revenue: c.gross_revenue,
      })),
    [productCampaigns]
  );

  const liveChartData = useMemo(
    () =>
      liveCampaigns.map((c) => ({
        name:
          c.campaign_name.length > 20
            ? c.campaign_name.slice(0, 20) + "..."
            : c.campaign_name,
        Revenue: c.gross_revenue,
      })),
    [liveCampaigns]
  );

  /* Computed: Creatives sorted + filtered ---------------------------------- */
  const creativeTypes = useMemo(() => {
    const types = new Set(creatives.map((c) => c.creative_type));
    return Array.from(types).filter(Boolean);
  }, [creatives]);

  const filteredCreatives = useMemo(() => {
    let list =
      creativeTypeFilter === "all"
        ? creatives
        : creatives.filter((c) => c.creative_type === creativeTypeFilter);

    list = [...list].sort((a, b) => {
      const aVal = (a as any)[creativeSortCol] ?? 0;
      const bVal = (b as any)[creativeSortCol] ?? 0;
      return creativeSortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [creatives, creativeTypeFilter, creativeSortCol, creativeSortDir]);

  const topCreativeId = useMemo(() => {
    if (filteredCreatives.length === 0) return null;
    const top = filteredCreatives.reduce((best, c) =>
      c.roi > best.roi ? c : best
    );
    return top.id;
  }, [filteredCreatives]);

  /* Handlers --------------------------------------------------------------- */
  const handleCreativeSort = useCallback(
    (col: string) => {
      if (creativeSortCol === col) {
        setCreativeSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setCreativeSortCol(col);
        setCreativeSortDir("desc");
      }
    },
    [creativeSortCol]
  );

  /* Table header style ----------------------------------------------------- */
  const thClass =
    "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8b949e]";
  const tdClass = "px-4 py-3 text-sm text-[#e6edf3] whitespace-nowrap";

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">Campanas</h1>
          <p className="text-sm text-[#8b949e]">
            Rendimiento de campanas publicitarias
          </p>
        </div>
        <DateRangePicker />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="product">
        <TabsList
          variant="line"
          className="border-b border-[#30363d] bg-transparent"
        >
          <TabsTrigger
            value="product"
            className="px-4 py-2 text-sm data-[active]:text-[#f97316]"
          >
            GMV Max / Product
          </TabsTrigger>
          <TabsTrigger
            value="lives"
            className="px-4 py-2 text-sm data-[active]:text-[#f97316]"
          >
            Lives
          </TabsTrigger>
          <TabsTrigger
            value="creatives"
            className="px-4 py-2 text-sm data-[active]:text-[#f97316]"
          >
            Creativos por campana
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/*  TAB 1: GMV Max / Product                                      */}
        {/* ============================================================== */}
        <TabsContent value="product" className="mt-6 space-y-6">
          {loading ? (
            <>
              <KPISkeleton />
              <TableSkeleton cols={8} />
            </>
          ) : productCampaigns.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <KPICard
                  title="Costo Total"
                  value={formatMXN(productSummary.totalCost)}
                  icon={DollarSign}
                />
                <KPICard
                  title="Revenue Bruto"
                  value={formatMXN(productSummary.grossRevenue)}
                  icon={TrendingUp}
                />
                <KPICard
                  title="ROI"
                  value={`${productSummary.roi.toFixed(2)}x`}
                  icon={Target}
                />
                <KPICard
                  title="Ordenes SKU"
                  value={formatNumber(productSummary.skuOrders)}
                  icon={ShoppingCart}
                />
                <KPICard
                  title="Costo por Orden"
                  value={formatMXN(productSummary.costPerOrder)}
                  icon={DollarSign}
                />
              </div>

              {/* Campaigns table */}
              <div className="overflow-x-auto rounded-xl border border-[#30363d] bg-[#1c2128]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#30363d]">
                      <th className={thClass}>Campana</th>
                      <th className={thClass}>Costo</th>
                      <th className={thClass}>Costo Neto</th>
                      <th className={thClass}>Presupuesto</th>
                      <th className={thClass}>Ordenes</th>
                      <th className={thClass}>Revenue</th>
                      <th className={thClass}>ROI</th>
                      <th className={thClass}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productCampaigns.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[#30363d]/50 hover:bg-[#161b22] transition-colors"
                      >
                        <td className={`${tdClass} max-w-[200px] truncate font-medium`}>
                          {c.campaign_name}
                        </td>
                        <td className={tdClass}>{formatMXN(c.cost)}</td>
                        <td className={tdClass}>{formatMXN(c.net_cost)}</td>
                        <td className={tdClass}>{formatMXN(c.current_budget)}</td>
                        <td className={tdClass}>{formatNumber(c.sku_orders)}</td>
                        <td className={tdClass}>{formatMXN(c.gross_revenue)}</td>
                        <td className={`${tdClass} font-semibold ${roiColor(c.roi)}`}>
                          {c.roi.toFixed(2)}x
                        </td>
                        <td className={tdClass}>
                          {statusBadge(c.roi_protection || "Active")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bar chart: Cost vs Revenue */}
              <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
                <h3 className="mb-4 text-sm font-medium text-[#e6edf3]">
                  Costo vs Revenue por campana
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productChartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#30363d"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#8b949e", fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={70}
                      />
                      <YAxis
                        tick={{ fill: "#8b949e", fontSize: 11 }}
                        tickFormatter={(v: number) =>
                          `$${(v / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        wrapperStyle={{ color: "#8b949e", fontSize: 12 }}
                      />
                      <Bar
                        dataKey="Costo"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Bar
                        dataKey="Revenue"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/*  TAB 2: Lives                                                  */}
        {/* ============================================================== */}
        <TabsContent value="lives" className="mt-6 space-y-6">
          {loading ? (
            <>
              <KPISkeleton />
              <TableSkeleton cols={7} />
            </>
          ) : liveCampaigns.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <KPICard
                  title="Costo Total"
                  value={formatMXN(liveSummary.totalCost)}
                  icon={DollarSign}
                />
                <KPICard
                  title="Revenue"
                  value={formatMXN(liveSummary.revenue)}
                  icon={TrendingUp}
                />
                <KPICard
                  title="ROI"
                  value={`${liveSummary.roi.toFixed(2)}x`}
                  icon={Target}
                />
                <KPICard
                  title="LIVE Views"
                  value={formatNumber(liveSummary.liveViews)}
                  icon={Eye}
                />
                <KPICard
                  title="LIVE Follows"
                  value={formatNumber(liveSummary.liveFollows)}
                  icon={UserPlus}
                />
              </div>

              {/* Livestreams table */}
              <div className="overflow-x-auto rounded-xl border border-[#30363d] bg-[#1c2128]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#30363d]">
                      <th className={thClass}>Campana</th>
                      <th className={thClass}>Costo</th>
                      <th className={thClass}>Ordenes</th>
                      <th className={thClass}>Revenue</th>
                      <th className={thClass}>ROI</th>
                      <th className={thClass}>LIVE Views</th>
                      <th className={thClass}>Views 10s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveCampaigns.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[#30363d]/50 hover:bg-[#161b22] transition-colors"
                      >
                        <td className={`${tdClass} max-w-[200px] truncate font-medium`}>
                          {c.campaign_name}
                        </td>
                        <td className={tdClass}>{formatMXN(c.cost)}</td>
                        <td className={tdClass}>{formatNumber(c.sku_orders)}</td>
                        <td className={tdClass}>{formatMXN(c.gross_revenue)}</td>
                        <td className={`${tdClass} font-semibold ${roiColor(c.roi)}`}>
                          {c.roi.toFixed(2)}x
                        </td>
                        <td className={tdClass}>{formatNumber(c.live_views)}</td>
                        <td className={tdClass}>{formatNumber(c.live_views_10s)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Revenue per livestream chart */}
              <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
                <h3 className="mb-4 text-sm font-medium text-[#e6edf3]">
                  Revenue por livestream
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={liveChartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#30363d"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#8b949e", fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={70}
                      />
                      <YAxis
                        tick={{ fill: "#8b949e", fontSize: 11 }}
                        tickFormatter={(v: number) =>
                          `$${(v / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="Revenue"
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/*  TAB 3: Creativos por campana                                  */}
        {/* ============================================================== */}
        <TabsContent value="creatives" className="mt-6 space-y-6">
          {loading ? (
            <TableSkeleton cols={9} rows={8} />
          ) : creatives.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Filter bar */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#8b949e]">Tipo de creativo:</label>
                <select
                  value={creativeTypeFilter}
                  onChange={(e) => setCreativeTypeFilter(e.target.value)}
                  className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-sm text-[#e6edf3] outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-colors"
                >
                  <option value="all">Todos</option>
                  {creativeTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Creatives table */}
              <div className="overflow-x-auto rounded-xl border border-[#30363d] bg-[#1c2128]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#30363d]">
                      <th className={thClass}>Campana</th>
                      <th className={thClass}>Tipo</th>
                      <th className={thClass}>Video</th>
                      <th className={thClass}>Cuenta</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>
                        <SortableHeader
                          label="Costo"
                          column="cost"
                          currentSort={creativeSortCol}
                          currentDir={creativeSortDir}
                          onSort={handleCreativeSort}
                        />
                      </th>
                      <th className={thClass}>Ordenes</th>
                      <th className={thClass}>
                        <SortableHeader
                          label="Revenue"
                          column="gross_revenue"
                          currentSort={creativeSortCol}
                          currentDir={creativeSortDir}
                          onSort={handleCreativeSort}
                        />
                      </th>
                      <th className={thClass}>
                        <SortableHeader
                          label="ROI"
                          column="roi"
                          currentSort={creativeSortCol}
                          currentDir={creativeSortDir}
                          onSort={handleCreativeSort}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCreatives.map((c) => {
                      const isTop = c.id === topCreativeId;
                      return (
                        <tr
                          key={c.id}
                          className={`border-b border-[#30363d]/50 hover:bg-[#161b22] transition-colors ${
                            isTop ? "border-l-2 border-l-[#22c55e] bg-[#22c55e]/5" : ""
                          }`}
                        >
                          <td className={`${tdClass} max-w-[160px] truncate font-medium`}>
                            {c.campaign_name}
                          </td>
                          <td className={tdClass}>
                            <span className="inline-flex items-center rounded-md bg-[#161b22] px-2 py-0.5 text-xs text-[#8b949e]">
                              {c.creative_type}
                            </span>
                          </td>
                          <td className={`${tdClass} max-w-[180px] truncate`}>
                            {c.video_title || "-"}
                          </td>
                          <td className={`${tdClass} max-w-[120px] truncate`}>
                            {c.tiktok_account || "-"}
                          </td>
                          <td className={tdClass}>{statusBadge(c.status)}</td>
                          <td className={tdClass}>{formatMXN(c.cost)}</td>
                          <td className={tdClass}>{formatNumber(c.sku_orders)}</td>
                          <td className={tdClass}>{formatMXN(c.gross_revenue)}</td>
                          <td
                            className={`${tdClass} font-semibold ${roiColor(c.roi)}`}
                          >
                            {c.roi.toFixed(2)}x
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
