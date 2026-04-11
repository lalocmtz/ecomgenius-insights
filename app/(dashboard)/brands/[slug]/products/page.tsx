"use client";

import { use, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Package, TrendingUp, ShoppingCart, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatMXN, formatNumber } from "@/lib/format";
import { useDateRange } from "@/hooks/use-date-range";
import { KPICard } from "@/components/dashboard/KPICard";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import type { Product, ProductTraffic } from "@/types";

export default function ProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { dateRange } = useDateRange();

  const [brandId, setBrandId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [traffic, setTraffic] = useState<ProductTraffic[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [productsRes, trafficRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("brand_id", brandId)
          .lte("period_start", to)
          .gte("period_end", from)
          .order("gmv", { ascending: false }),
        supabase
          .from("product_traffic")
          .select("*")
          .eq("brand_id", brandId)
          .gte("date", from)
          .lte("date", to)
          .order("date", { ascending: true }),
      ]);

      setProducts(productsRes.data ?? []);
      setTraffic(trafficRes.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [brandId, from, to]);

  const funnel = useMemo(() => {
    if (traffic.length === 0) return null;

    const views = traffic.reduce((s, t) => s + t.views, 0);
    const visitors = traffic.reduce((s, t) => s + t.unique_visitors, 0);
    const clicks = traffic.reduce((s, t) => s + t.clicks, 0);
    const addToCart = traffic.reduce((s, t) => s + t.add_to_cart_clicks, 0);
    const customers = traffic.reduce((s, t) => s + t.customers, 0);

    return [
      { label: "Views", value: views },
      { label: "Visitantes Unicos", value: visitors },
      { label: "Clicks", value: clicks },
      { label: "Agregar al Carrito", value: addToCart },
      { label: "Clientes", value: customers },
    ];
  }, [traffic]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#e6edf3]">Productos</h1>
          <DateRangePicker />
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
        <div className="h-64 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
      </div>
    );
  }

  if (products.length === 0 && traffic.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#e6edf3]">Productos</h1>
          <DateRangePicker />
        </div>
        <div className="flex h-64 items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128]">
          <p className="text-[#8b949e]">
            No hay datos de productos para el periodo seleccionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Productos</h1>
        <DateRangePicker />
      </div>

      {/* Product Ranking Table */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128] overflow-hidden">
        <div className="border-b border-[#30363d] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#e6edf3]">
            Ranking de Productos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#30363d] bg-[#161b22]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Rank
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Producto
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  GMV
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Items Vendidos
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Pedidos
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  GMV Store Tab
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                  Items Store Tab
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {products.map((p, i) => (
                <tr
                  key={p.id}
                  className="hover:bg-[#161b22] transition-colors"
                >
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : i === 1
                            ? "bg-gray-400/20 text-gray-300"
                            : i === 2
                              ? "bg-amber-700/20 text-amber-500"
                              : "text-[#8b949e]"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td
                    className="max-w-[300px] truncate px-3 py-2 font-medium text-[#e6edf3]"
                    title={p.name}
                  >
                    {p.name.length > 50
                      ? p.name.slice(0, 50) + "..."
                      : p.name}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "Active"
                          ? "bg-[#22c55e]/10 text-[#22c55e]"
                          : "bg-[#8b949e]/10 text-[#8b949e]"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatMXN(p.gmv)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatNumber(p.items_sold)}
                  </td>
                  <td className="px-3 py-2 text-[#e6edf3]">
                    {formatNumber(p.orders)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatMXN(p.gmv_store_tab)}
                  </td>
                  <td className="px-3 py-2 text-[#8b949e]">
                    {formatNumber(p.items_sold_store_tab)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traffic Stats Section */}
      {traffic.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e6edf3]">
            Trafico de Productos
          </h2>

          {/* Conversion Funnel */}
          {funnel && (
            <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
              <h3 className="mb-6 text-sm font-medium text-[#8b949e]">
                Embudo de Conversion
              </h3>
              <div className="space-y-2">
                {funnel.map((step, i) => {
                  const maxVal = funnel[0].value || 1;
                  const pct = (step.value / maxVal) * 100;
                  const convRate =
                    i > 0 && funnel[i - 1].value > 0
                      ? ((step.value / funnel[i - 1].value) * 100).toFixed(1)
                      : null;

                  return (
                    <div key={step.label}>
                      {convRate && (
                        <div className="flex items-center gap-2 py-1 pl-2">
                          <svg
                            className="h-3 w-3 text-[#8b949e]"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M6 2L6 10M6 10L3 7M6 10L9 7"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-xs text-[#8b949e]">
                            {convRate}%
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-right text-sm text-[#8b949e]">
                          {step.label}
                        </span>
                        <div className="relative h-8 flex-1 overflow-hidden rounded">
                          <div
                            className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-[#f97316] to-[#f97316]/60"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                          <span className="relative z-10 flex h-full items-center pl-3 text-xs font-medium text-[#e6edf3]">
                            {formatNumber(step.value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Traffic Table */}
          <div className="rounded-xl border border-[#30363d] bg-[#1c2128] overflow-hidden">
            <div className="border-b border-[#30363d] px-5 py-3">
              <h3 className="text-sm font-medium text-[#8b949e]">
                Trafico Diario
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#30363d] bg-[#161b22]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                      Fecha
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                      Views
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                      Visitantes
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                      Clicks Unicos
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                      Clicks
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                      Agregar al Carrito
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                      Usuarios Agregados
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8b949e]">
                      Clientes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]">
                  {traffic.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-[#161b22] transition-colors"
                    >
                      <td className="px-3 py-2 text-[#e6edf3]">
                        {format(new Date(t.date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-3 py-2 text-[#e6edf3]">
                        {formatNumber(t.views)}
                      </td>
                      <td className="px-3 py-2 text-[#e6edf3]">
                        {formatNumber(t.unique_visitors)}
                      </td>
                      <td className="px-3 py-2 text-[#e6edf3]">
                        {formatNumber(t.unique_clicks)}
                      </td>
                      <td className="px-3 py-2 text-[#e6edf3]">
                        {formatNumber(t.clicks)}
                      </td>
                      <td className="px-3 py-2 text-[#e6edf3]">
                        {formatNumber(t.add_to_cart_clicks)}
                      </td>
                      <td className="px-3 py-2 text-[#8b949e]">
                        {formatNumber(t.users_added_to_cart)}
                      </td>
                      <td className="px-3 py-2 text-[#e6edf3]">
                        {formatNumber(t.customers)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
