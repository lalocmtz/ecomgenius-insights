import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface HistoricalSession {
  id: string;
  brand_id: string;
  user_id: string;
  live_date: string;
  gmv: number;
  gasto_ads: number;
  pedidos: number;
  roi?: number;
  margen?: number;
  created_at: string;
}

interface HistoryStats {
  totalGmv: number;
  totalAdSpend: number;
  totalOrders: number;
  avgRoi: number;
  avgMargin: number;
  daysCount: number;
}

interface Props {
  brandId: string;
  userId: string;
  days?: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function SellerCenterAnalytics({
  brandId,
  userId,
  days = 60,
  isOpen,
  onToggle,
}: Props) {
  const [sessions, setSessions] = useState<HistoricalSession[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    totalGmv: 0,
    totalAdSpend: 0,
    totalOrders: 0,
    avgRoi: 0,
    avgMargin: 0,
    daysCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos históricos
  useEffect(() => {
    if (!isOpen || !brandId || !userId) return;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/seller-center-history?brandId=${brandId}&userId=${userId}&days=${days}`
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setSessions(data.sessions || []);
          setStats(data.stats);
        } else {
          throw new Error(data.error || "Error loading history");
        }
      } catch (err: any) {
        const message = err?.message || "Error al cargar histórico";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [isOpen, brandId, userId, days]);

  // Preparar datos para gráfico
  const chartData = sessions
    .map((s) => ({
      date: new Date(s.created_at).toLocaleDateString("es-MX", { month: "short", day: "numeric" }),
      gmv: s.gmv,
      gastoAds: s.gasto_ads,
      roi: s.roi ? (s.roi * 100).toFixed(0) : 0,
    }))
    .reverse();

  const roiPorcentaje = stats.avgRoi ? (stats.avgRoi * 100).toFixed(1) : "0";
  const margenPorcentaje = stats.avgMargin ? (stats.avgMargin * 100).toFixed(1) : "0";
  const aov = stats.daysCount > 0 ? (stats.totalGmv / stats.totalOrders).toFixed(2) : "0"; // Average Order Value

  return (
    <div className="w-full">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={20} />
          <span className="font-semibold">Análisis  Últimos {days} Días</span>
        </div>
        <span>{isOpen ? "▼" : "▶"}</span>
      </button>

      {/* Contenido */}
      {isOpen && (
        <div className="mt-4 space-y-6 bg-slate-50 p-6 rounded-lg">
          {/* Indicadores de carga/error */}
          {loading && (
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm text-blue-700">Cargando datos...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded">
              <AlertCircle size={18} className="text-amber-600" />
              <span className="text-sm text-amber-700">{error}</span>
            </div>
          )}

          {!loading && !error && stats.daysCount === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay datos históricos disponibles aún.</p>
              <p className="text-sm mt-1">Haz clic en "Sincronizar Seller Center" para comenzar.</p>
            </div>
          )}

          {stats.daysCount > 0 && (
            <>
              {/* Tarjetas de métricas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase">GMV Total</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    ${stats.totalGmv.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{stats.daysCount} días</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase">Gasto Ads</div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    ${stats.totalAdSpend.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total invertido</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase">Pedidos</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalOrders}</div>
                  <div className="text-xs text-gray-500 mt-1">AOV: ${aov}</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase">ROI Promedio</div>
                  <div className="text-2xl font-bold text-purple-600 mt-1">{roiPorcentaje}%</div>
                  <div className="text-xs text-gray-500 mt-1">Retorno</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase">Margen Promedio</div>
                  <div className="text-2xl font-bold text-orange-600 mt-1">{margenPorcentaje}%</div>
                  <div className="text-xs text-gray-500 mt-1">Ganancia</div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold uppercase">ROAS</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">
                    {stats.totalAdSpend > 0 ? ((stats.totalGmv / stats.totalAdSpend) * 100).toFixed(0) + "%" : "N/A"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">GMV/Ads</div>
                </div>
              </div>

              {/* Gráfico */}
              {chartData.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Tendencia: GMV vs Gasto en Ads</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                        formatter={(value) => `$${typeof value === "number" ? value.toLocaleString() : value}`}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="gmv"
                        stroke="#10b981"
                        dot={false}
                        strokeWidth={2}
                        name="GMV ($)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="gastoAds"
                        stroke="#ef4444"
                        dot={false}
                        strokeWidth={2}
                        name="Ads ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tabla de sesiones */}
              {sessions.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Detalles de Sesiones</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Fecha</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">GMV</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">Ads</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">Pedidos</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">ROI</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">Margen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.slice(0, 15).map((session) => (
                          <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">
                              {new Date(session.created_at).toLocaleDateString("es-MX")}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-green-600">
                              ${session.gmv?.toLocaleString() || 0}
                            </td>
                            <td className="px-4 py-2 text-right text-red-600">
                              ${session.gasto_ads?.toLocaleString() || 0}
                            </td>
                            <td className="px-4 py-2 text-right text-blue-600">{session.pedidos || 0}</td>
                            <td className="px-4 py-2 text-right text-purple-600">
                              {session.roi ? `${(session.roi * 100).toFixed(0)}%` : "—"}
                            </td>
                            <td className="px-4 py-2 text-right text-orange-600">
                              {session.margen ? `${(session.margen * 100).toFixed(1)}%` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sessions.length > 15 && (
                    <div className="p-4 text-center text-sm text-gray-600 bg-gray-50">
                      Mostrando 15 de {sessions.length} sesiones. Más disponibles.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
