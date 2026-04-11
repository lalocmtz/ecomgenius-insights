"use client";

import { use, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Megaphone,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatMXN, formatNumber } from "@/lib/format";
import { Suspense } from "react";
import { useDateRange } from "@/hooks/use-date-range";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { KPICard } from "@/components/dashboard/KPICard";
import { GMVChart } from "@/components/dashboard/GMVChart";
import { OrdersChart } from "@/components/dashboard/OrdersChart";
import type {
  Brand,
  DailyOverview,
  ProductCampaign,
  LiveCampaign,
  Product,
} from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4"
        >
          <div className="h-3 w-20 animate-pulse rounded bg-[#30363d]" />
          <div className="mt-3 h-7 w-28 animate-pulse rounded bg-[#30363d]" />
          <div className="mt-2 h-3 w-16 animate-pulse rounded bg-[#30363d]" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-[#30363d]" />
      <div className="h-[300px] animate-pulse rounded bg-[#30363d]/30" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[#30363d]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[#30363d] py-3 last:border-0"
        >
          <div className="h-4 w-8 animate-pulse rounded bg-[#30363d]" />
          <div className="h-4 flex-1 animate-pulse rounded bg-[#30363d]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[#30363d]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128] p-12">
      <ShoppingCart className="mb-3 h-10 w-10 text-[#30363d]" />
      <p className="text-sm font-medium text-[#e6edf3]">
        No hay datos disponibles
      </p>
      <p className="mt-1 text-xs text-[#8b949e]">
        Sube datos o selecciona un rango de fechas diferente
      </p>
    </div>
  );
}

export default function BrandOverviewPage({ params }: PageProps) {
  const { slug } = use(params);
  const { dateRange } = useDateRange();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [dailyData, setDailyData] = useState<DailyOverview[]>([]);
  const [productCampaigns, setProductCampaigns] = useState<ProductCampaign[]>(
    []
  );
  const [liveCampaigns, setLiveCampaigns] = useState<LiveCampaign[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const startStr = format(dateRange.start, "yyyy-MM-dd");
  const endStr = format(dateRange.end, "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      const { data: brandData } = await supabase
        .from("brands")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!brandData || cancelled) {
        setLoading(false);
        return;
      }

      setBrand(brandData as Brand);
      const brandId = brandData.id;

      const [dailyRes, prodCampRes, liveCampRes, productsRes] =
        await Promise.all([
          supabase
            .from("daily_overview")
            .select("*")
            .eq("brand_id", brandId)
            .gte("date", startStr)
            .lte("date", endStr)
            .order("date", { ascending: true }),
          supabase
            .from("product_campaigns")
            .select("*")
            .eq("brand_id", brandId)
            .gte("period_start", startStr)
            .lte("period_end", endStr),
          supabase
            .from("live_campaigns")
            .select("*")
            .eq("brand_id", brandId)
            .gte("period_start", startStr)
            .lte("period_end", endStr),
          supabase
            .from("products")
            .select("*")
            .eq("brand_id", brandId)
            .order("gmv", { ascending: false })
            .limit(5),
        ]);

      if (cancelled) return;

      setDailyData((dailyRes.data as DailyOverview[]) || []);
      setProductCampaigns((prodCampRes.data as ProductCampaign[]) || []);
      setLiveCampaigns((liveCampRes.data as LiveCampaign[]) || []);
      setTopProducts((productsRes.data as Product[]) || []);
      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [slug, startStr, endStr]);

  const kpis = useMemo(() => {
    const totalGMV = dailyData.reduce((sum, d) => sum + d.gmv, 0);
    const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
    const totalRefunds = dailyData.reduce((sum, d) => sum + d.refunds, 0);
    const aov = totalOrders > 0 ? totalGMV / totalOrders : 0;

    const productAdSpend = productCampaigns.reduce(
      (sum, c) => sum + c.cost,
      0
    );
    const liveAdSpend = liveCampaigns.reduce((sum, c) => sum + c.cost, 0);
    const totalAdSpend = productAdSpend + liveAdSpend;

    const roasBlended = totalAdSpend > 0 ? totalGMV / totalAdSpend : 0;

    const productCostPct = brand?.product_cost_pct ?? 0;
    const commissionTiktok = brand?.commission_tiktok ?? 0;
    const retentionPct = brand?.retention_pct ?? 0;
    const ivaAdsPct = brand?.iva_ads_pct ?? 0;

    const utilidadEstimada =
      totalGMV -
      totalRefunds -
      totalGMV * (productCostPct / 100) -
      totalGMV * (commissionTiktok / 100) -
      totalGMV * (retentionPct / 100) -
      totalAdSpend -
      totalAdSpend * (ivaAdsPct / 100);

    return {
      totalGMV,
      totalOrders,
      aov,
      totalAdSpend,
      roasBlended,
      utilidadEstimada,
      productAdSpend,
      liveAdSpend,
    };
  }, [dailyData, productCampaigns, liveCampaigns, brand]);

  const chartGMVData = useMemo(
    () =>
      dailyData.map((d) => ({
        date: format(new Date(d.date), "dd/MM"),
        gmv: d.gmv,
      })),
    [dailyData]
  );

  const chartOrdersData = useMemo(
    () =>
      dailyData.map((d) => ({
        date: format(new Date(d.date), "dd/MM"),
        orders: d.orders,
      })),
    [dailyData]
  );

  const productCampaignROI = useMemo(() => {
    const totalRevenue = productCampaigns.reduce(
      (sum, c) => sum + c.gross_revenue,
      0
    );
    const totalCost = productCampaigns.reduce((sum, c) => sum + c.cost, 0);
    return totalCost > 0 ? totalRevenue / totalCost : 0;
  }, [productCampaigns]);

  const liveCampaignROI = useMemo(() => {
    const totalRevenue = liveCampaigns.reduce(
      (sum, c) => sum + c.gross_revenue,
      0
    );
    const totalCost = liveCampaigns.reduce((sum, c) => sum + c.cost, 0);
    return totalCost > 0 ? totalRevenue / totalCost : 0;
  }, [liveCampaigns]);

  const hasData = dailyData.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">
            {brand?.name ?? "Cargando..."}
          </h1>
          <p className="mt-1 text-sm text-[#8b949e]">
            Vista general del rendimiento
          </p>
        </div>
        <Suspense fallback={<div className="h-9 w-64 animate-pulse rounded-lg bg-[#30363d]" />}>
          <DateRangePicker />
        </Suspense>
      </div>

      {loading ? (
        <>
          <KPISkeleton />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TableSkeleton />
            </div>
            <TableSkeleton />
          </div>
        </>
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* KPI Cards */}
          <Suspense fallback={<KPISkeleton />}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <KPICard
              title="GMV Bruto"
              value={formatMXN(kpis.totalGMV)}
              icon={DollarSign}
            />
            <KPICard
              title="Pedidos"
              value={formatNumber(kpis.totalOrders)}
              icon={ShoppingCart}
            />
            <KPICard
              title="Ticket Promedio"
              value={formatMXN(kpis.aov)}
              icon={Receipt}
            />
            <KPICard
              title="Gasto Ads Total"
              value={formatMXN(kpis.totalAdSpend)}
              icon={Megaphone}
            />
            <KPICard
              title="ROAS Blended"
              value={`${kpis.roasBlended.toFixed(2)}x`}
              icon={TrendingUp}
              subtitle={kpis.roasBlended >= 3 ? "Saludable" : kpis.roasBlended >= 1 ? "Aceptable" : "Bajo"}
            />
            <KPICard
              title="Utilidad Estimada"
              value={formatMXN(kpis.utilidadEstimada)}
              icon={Wallet}
              subtitle={kpis.utilidadEstimada > 0 ? "Positiva" : "Negativa"}
            />
          </div>
          </Suspense>

          {/* Charts */}
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          }>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <GMVChart data={chartGMVData} />
            <OrdersChart data={chartOrdersData} />
          </div>
          </Suspense>

          {/* Bottom Section */}
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2"><TableSkeleton /></div>
              <TableSkeleton />
            </div>
          }>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Top 5 Products */}
            <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4 lg:col-span-2">
              <h3 className="mb-4 text-sm font-medium text-[#e6edf3]">
                Top 5 Productos
              </h3>
              {topProducts.length === 0 ? (
                <p className="py-4 text-center text-xs text-[#8b949e]">
                  Sin datos de productos
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#30363d] text-left text-xs text-[#8b949e]">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Producto</th>
                      <th className="pb-2 text-right font-medium">GMV</th>
                      <th className="pb-2 text-right font-medium">
                        Unidades
                      </th>
                      <th className="pb-2 text-right font-medium">Pedidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, idx) => (
                      <tr
                        key={product.id}
                        className="border-b border-[#30363d] last:border-0"
                      >
                        <td className="py-3 text-xs text-[#8b949e]">
                          {idx + 1}
                        </td>
                        <td className="max-w-[300px] truncate py-3 text-sm text-[#e6edf3]">
                          {product.name}
                        </td>
                        <td className="py-3 text-right text-sm text-[#e6edf3]">
                          {formatMXN(product.gmv)}
                        </td>
                        <td className="py-3 text-right text-sm text-[#e6edf3]">
                          {formatNumber(product.items_sold)}
                        </td>
                        <td className="py-3 text-right text-sm text-[#e6edf3]">
                          {formatNumber(product.orders)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Campaign Summary */}
            <div className="space-y-4">
              <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
                <h3 className="mb-2 text-sm font-medium text-[#e6edf3]">
                  Product Campaigns
                </h3>
                <p className="text-2xl font-bold text-[#f97316]">
                  {productCampaignROI.toFixed(2)}x
                </p>
                <p className="mt-1 text-xs text-[#8b949e]">
                  ROI &middot; Gasto:{" "}
                  {formatMXN(kpis.productAdSpend)}
                </p>
                <p className="text-xs text-[#8b949e]">
                  {formatNumber(productCampaigns.length)} campanas activas
                </p>
              </div>
              <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
                <h3 className="mb-2 text-sm font-medium text-[#e6edf3]">
                  Live Campaigns
                </h3>
                <p className="text-2xl font-bold text-[#22c55e]">
                  {liveCampaignROI.toFixed(2)}x
                </p>
                <p className="mt-1 text-xs text-[#8b949e]">
                  ROI &middot; Gasto:{" "}
                  {formatMXN(kpis.liveAdSpend)}
                </p>
                <p className="text-xs text-[#8b949e]">
                  {formatNumber(liveCampaigns.length)} campanas activas
                </p>
              </div>
            </div>
          </div>
          </Suspense>
        </>
      )}
    </div>
  );
}
