import { useAppStore } from '@/store/useAppStore';
import { useDashboardData, KPI_CANAL_MAP, calcVentasNetas, calcCostos, calcGastoAds, type MetricRow } from '@/hooks/useDashboardData';
import { useDailyMetrics, useUpdateCell } from '@/hooks/useSupabaseData';
import { EditableCell } from '@/components/EditableCell';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import { Plus, Download, DollarSign, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, Crosshair } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, AreaChart, Area,
} from 'recharts';
import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ── helpers ── */
function calcProfit(rows: MetricRow[]) {
  return rows.reduce((s, r) =>
    (r.ventas_brutas || 0) - (r.cogs || 0) - (r.guias || 0) - (r.comision_tts || 0) -
    (r.iva_ads || 0) - (r.retenciones || 0) - (r.anuncios || 0) - (r.gastos_fijos || 0) + s, 0);
}

function SparkLine({ data, color = '#22c55e', height = 28 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={height} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span className="text-[10px] text-gray-500">—</span>;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

type SortKey = 'date' | 'canal' | 'ventas_brutas' | 'pedidos' | 'guias' | 'anuncios' | 'profit';
type SortDir = 'asc' | 'desc';

const CANAL_COLORS: Record<string, string> = {
  'Meta': '#4267B2', 'Google': '#34A853', 'TikTok Ads': '#FF004F',
  'GMV MAX': '#25F4EE', 'Lives': '#EF4444', 'Email': '#F59E0B',
  'Mercado Libre': '#FFE600', 'Afiliados TikTok': '#69C9D0',
  'Amazon': '#FF9900', 'Burbuxa': '#A78BFA', 'tiktok': '#FF004F',
  'shopify': '#96BF48', 'meta': '#4267B2', 'mayoreo': '#F59E0B',
};

const CANAL_ICONS: Record<string, string> = {
  'Meta': '📘', 'Google': '🔍', 'TikTok Ads': '📱', 'GMV MAX': '🎵',
  'Lives': '🔴', 'Email': '✉️', 'Mercado Libre': '🛒',
  'tiktok': '📱', 'shopify': '🛒', 'meta': '📘', 'mayoreo': '📦',
};

export default function Ventas() {
  const { activeBrand } = useAppStore();
  const { metrics: dashMetrics, isLoading: dashLoading } = useDashboardData(activeBrand);
  const { data: rawMetrics, isLoading: tableLoading } = useDailyMetrics();
  const updateCell = useUpdateCell('daily_metrics');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [chartView, setChartView] = useState<'ventas' | 'pedidos' | 'ads' | 'profit'>('ventas');

  const isLoading = dashLoading || tableLoading;
  const metrics = rawMetrics || [];

  /* ── KPI calculations ── */
  const kpis = useMemo(() => {
    const ventasBrutas = dashMetrics.reduce((s, r) => s + r.ventas_brutas, 0);
    const pedidos = dashMetrics.reduce((s, r) => s + r.pedidos, 0);
    const gastoAds = calcGastoAds(dashMetrics);
    const profit = calcProfit(dashMetrics);
    const guias = dashMetrics.reduce((s, r) => s + (r.guias || 0), 0);
    const roas = gastoAds > 0 ? ventasBrutas / gastoAds : 0;
    const aov = pedidos > 0 ? ventasBrutas / pedidos : 0;
    const margen = ventasBrutas > 0 ? profit / ventasBrutas : 0;
    return { ventasBrutas, pedidos, gastoAds, profit, guias, roas, aov, margen };
  }, [dashMetrics]);

  /* ── Daily trend for sparklines ── */
  const dailyTrend = useMemo(() => {
    const map: Record<string, { ventas: number; pedidos: number; ads: number; profit: number }> = {};
    dashMetrics.forEach(m => {
      if (!map[m.date]) map[m.date] = { ventas: 0, pedidos: 0, ads: 0, profit: 0 };
      map[m.date].ventas += m.ventas_brutas;
      map[m.date].pedidos += m.pedidos;
      map[m.date].ads += m.anuncios;
      map[m.date].profit += (m.ventas_brutas - (m.cogs || 0) - (m.guias || 0) - (m.comision_tts || 0) -
        (m.iva_ads || 0) - (m.retenciones || 0) - (m.anuncios || 0) - (m.gastos_fijos || 0));
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [dashMetrics]);

  const sparkVentas = dailyTrend.map(([, d]) => d.ventas);
  const sparkPedidos = dailyTrend.map(([, d]) => d.pedidos);
  const sparkAds = dailyTrend.map(([, d]) => d.ads);
  const sparkProfit = dailyTrend.map(([, d]) => d.profit);

  /* ── Channel breakdown for chart ── */
  const channelData = useMemo(() => {
    const map: Record<string, { ventas: number; pedidos: number; ads: number; profit: number }> = {};
    dashMetrics.forEach(m => {
      if (!map[m.canal]) map[m.canal] = { ventas: 0, pedidos: 0, ads: 0, profit: 0 };
      map[m.canal].ventas += m.ventas_brutas;
      map[m.canal].pedidos += m.pedidos;
      map[m.canal].ads += m.anuncios;
      map[m.canal].profit += (m.ventas_brutas - (m.cogs || 0) - (m.guias || 0) - (m.comision_tts || 0) -
        (m.iva_ads || 0) - (m.retenciones || 0) - (m.anuncios || 0) - (m.gastos_fijos || 0));
    });
    return Object.entries(map)
      .map(([canal, d]) => ({ canal, ...d }))
      .sort((a, b) => b[chartView] - a[chartView]);
  }, [dashMetrics, chartView]);

  /* ── Daily area chart data ── */
  const areaChartData = useMemo(() => {
    return dailyTrend.map(([date, d]) => ({ date: date.slice(5), ...d }));
  }, [dailyTrend]);

  /* ── Row-level profit calc + sorting ── */
  const sortedRows = useMemo(() => {
    const rows = metrics.map(m => ({
      ...m,
      profit: (m.ventas_brutas || 0) - (m.cogs || 0) - (m.guias || 0) - (m.comision_tts || 0) -
        (m.iva_ads || 0) - (m.retenciones || 0) - (m.anuncios || 0) - (m.gastos_fijos || 0),
    }));
    return rows.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [metrics, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={12} className="text-gray-600" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-orange-400" /> : <ChevronDown size={12} className="text-orange-400" />;
  };

  /* ── Actions ── */
  const addDay = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_metrics').insert({ brand: activeBrand, date: today, canal: 'tiktok', ventas_brutas: 0, pedidos: 0 });
    if (error) toast.error(error.message); else toast.success('Día agregado');
  };

  const exportCSV = () => {
    if (!metrics.length) return;
    const headers = ['Fecha', 'Canal', 'Ventas', 'Pedidos', 'Guías', 'Anuncios', 'COGS', 'Profit'];
    const rows = sortedRows.map(m => [m.date, m.canal, m.ventas_brutas, m.pedidos, m.guias, m.anuncios, m.cogs, m.profit]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ventas.csv'; a.click();
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-gray-800 rounded-lg" />;

  const accentColor = activeBrand === 'Feel Ink' ? '#f97316' : '#1A8A72';

  const CHART_TABS = [
    { key: 'ventas' as const, label: 'Ventas' },
    { key: 'pedidos' as const, label: 'Pedidos' },
    { key: 'ads' as const, label: 'Gasto Ads' },
    { key: 'profit' as const, label: 'Profit' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Intelligence Suite</p>
          <h1 className="text-2xl font-medium text-white">Ventas</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={addDay} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-white" style={{ background: accentColor }}>
            <Plus size={14} /> Agregar día
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Hero KPIs — 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Ventas Brutas', value: formatMXN(kpis.ventasBrutas), icon: DollarSign, spark: sparkVentas, color: accentColor },
          { label: 'Pedidos', value: kpis.pedidos.toLocaleString(), icon: ShoppingCart, spark: sparkPedidos, color: '#3b82f6' },
          { label: 'Ticket Promedio', value: formatMXN(kpis.aov), icon: TrendingUp, spark: [], color: '#8b5cf6' },
          { label: 'Gasto Ads', value: formatMXN(kpis.gastoAds), icon: Target, spark: sparkAds, color: '#ef4444' },
          { label: 'ROAS Blended', value: formatROAS(kpis.roas), icon: TrendingUp, spark: [], color: '#22c55e' },
          { label: 'Profit', value: formatMXN(kpis.profit), icon: DollarSign, spark: sparkProfit, color: kpis.profit >= 0 ? '#22c55e' : '#ef4444' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">{kpi.label}</p>
              <kpi.icon size={14} style={{ color: kpi.color }} />
            </div>
            <p className="text-lg font-medium text-white">{kpi.value}</p>
            {kpi.spark.length > 1 && <SparkLine data={kpi.spark} color={kpi.color} />}
          </div>
        ))}
      </div>

      {/* Charts section — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Daily area chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-medium text-white mb-3">Tendencia Diaria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaChartData}>
              <defs>
                <linearGradient id="ventasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                formatter={(v: number, name: string) => [name === 'ventas' ? formatMXN(v) : v.toLocaleString(), name === 'ventas' ? 'Ventas' : name === 'profit' ? 'Profit' : 'Pedidos']} />
              <Area type="monotone" dataKey="ventas" stroke={accentColor} fill="url(#ventasGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Channel bar chart with tabs */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Por Canal</h3>
            <div className="flex gap-1">
              {CHART_TABS.map(t => (
                <button key={t.key} onClick={() => setChartView(t.key)}
                  className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md transition-colors ${chartView === t.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  style={chartView === t.key ? { background: accentColor } : {}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channelData} layout="vertical" margin={{ left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
                tickFormatter={v => chartView === 'pedidos' ? v.toLocaleString() : `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="canal" tick={{ fontSize: 11, fill: '#d1d5db' }} axisLine={false} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                formatter={(v: number) => [chartView === 'pedidos' ? v.toLocaleString() : formatMXN(v), CHART_TABS.find(t => t.key === chartView)?.label]} />
              <Bar dataKey={chartView} radius={[0, 4, 4, 0]} barSize={18}>
                {channelData.map((d) => (
                  <Cell key={d.canal} fill={chartView === 'profit' && d.profit < 0 ? '#ef4444' : (CANAL_COLORS[d.canal] || accentColor)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sortable daily table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-sm font-medium text-white">Detalle Diario</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {([
                  ['date', 'Fecha'],
                  ['canal', 'Canal'],
                  ['ventas_brutas', 'Ventas'],
                  ['pedidos', 'Pedidos'],
                  ['guias', 'Guías'],
                  ['anuncios', 'Anuncios'],
                  ['profit', 'Profit'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} onClick={() => toggleSort(key)}
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-medium cursor-pointer hover:text-gray-300 select-none">
                    <span className="inline-flex items-center gap-1">{label} <SortIcon col={key} /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(m => (
                <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{m.date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{CANAL_ICONS[m.canal] || '📊'}</span>
                      <span className="font-medium" style={{ color: CANAL_COLORS[m.canal] || accentColor }}>{m.canal}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <EditableCell value={m.ventas_brutas} onSave={v => updateCell.mutate({ id: m.id, field: 'ventas_brutas', value: parseFloat(v) })} type="number" />
                  </td>
                  <td className="px-4 py-3">
                    <EditableCell value={m.pedidos} onSave={v => updateCell.mutate({ id: m.id, field: 'pedidos', value: parseInt(v) })} type="number" />
                  </td>
                  <td className="px-4 py-3">
                    <EditableCell value={m.guias || 0} onSave={v => updateCell.mutate({ id: m.id, field: 'guias', value: parseFloat(v) })} type="number" />
                  </td>
                  <td className="px-4 py-3">
                    <EditableCell value={m.anuncios || 0} onSave={v => updateCell.mutate({ id: m.id, field: 'anuncios', value: parseFloat(v) })} type="number" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${m.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatMXN(m.profit)}
                    </span>
                  </td>
                </tr>
              ))}
              {!sortedRows.length && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Sin datos — agrega métricas diarias</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
