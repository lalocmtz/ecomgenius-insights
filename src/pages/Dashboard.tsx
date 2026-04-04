import { useAppStore } from '@/store/useAppStore';
import { useDashboardData, KPI_CANAL_MAP, calcVentasNetas, calcCostos, calcGastoAds, type MetricRow } from '@/hooks/useDashboardData';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, Target, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell, ReferenceLine,
} from 'recharts';
import { useMemo, useState } from 'react';
import { Progress } from '@/components/ui/progress';

const CANAL_ICONS: Record<string, string> = {
  'Meta': '📘', 'Google': '🔍', 'TikTok Ads': '📱', 'GMV MAX': '🎵',
  'Lives': '🔴', 'Email': '✉️', 'Mercado Libre': '🛒',
  'Afiliados TikTok': '🤝', 'Amazon': '📦', 'Burbuxa': '🫧',
};

const CANAL_COLORS: Record<string, string> = {
  'Meta': '#4267B2', 'Google': '#34A853', 'TikTok Ads': '#FF004F',
  'GMV MAX': '#25F4EE', 'Lives': '#EF4444', 'Email': '#F59E0B',
  'Mercado Libre': '#FFE600', 'Afiliados TikTok': '#69C9D0',
  'Amazon': '#FF9900', 'Burbuxa': '#A78BFA',
};

function calcProfit(rows: MetricRow[]) {
  return rows.reduce((s, r) => {
    const vn = r.ventas_brutas - r.descuentos - r.devoluciones;
    const cost = r.cogs + r.guias + r.comision_tts + r.iva_ads + r.retenciones + r.anuncios + r.gastos_fijos;
    return s + vn - cost;
  }, 0);
}

function SparkLine({ data, color = '#22c55e', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={height} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span className="text-[10px] text-muted-foreground">—</span>;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function Dashboard() {
  const { activeBrand } = useAppStore();
  const isFI = activeBrand === 'feel_ink';
  const { metrics, kpis, isLoading, periodo } = useDashboardData(activeBrand);
  const [sortCol, setSortCol] = useState<string>('ventas');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ─── Totals ───
  const ventasBrutas = metrics.reduce((s, r) => s + r.ventas_brutas, 0);
  const ventasNetas = calcVentasNetas(metrics);
  const costos = calcCostos(metrics);
  const gastoAds = calcGastoAds(metrics);
  const utilidad = ventasNetas - costos;
  const margen = ventasNetas ? (utilidad / ventasNetas) * 100 : 0;
  const pedidosTotal = metrics.reduce((s, r) => s + r.pedidos, 0);
  const roasBlended = gastoAds ? ventasBrutas / gastoAds : 0;
  const ticketPromedio = pedidosTotal ? ventasBrutas / pedidosTotal : 0;

  // ─── Meta ventas from KPIs ───
  const metaVentas = useMemo(() => {
    return kpis
      .filter(k => k.kpi_slug.startsWith('ventas_'))
      .reduce((s, k) => s + (k.valor_target || 0), 0);
  }, [kpis]);

  const avanceMeta = metaVentas ? (ventasBrutas / metaVentas) * 100 : 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const daysLeft = daysInMonth - daysPassed;
  const faltante = Math.max(0, metaVentas - ventasBrutas);
  const ventasDiariasNecesarias = daysLeft > 0 ? faltante / daysLeft : 0;
  const ritmoEsperado = (daysPassed / daysInMonth) * 100;
  const progressColor = avanceMeta >= ritmoEsperado ? 'bg-emerald-500' : avanceMeta >= ritmoEsperado * 0.7 ? 'bg-yellow-500' : 'bg-red-500';

  // ─── Sparklines (last 7 days) ───
  const dailyTotals = useMemo(() => {
    const byDate: Record<string, { ventas: number; utilidad: number; ads: number; pedidos: number }> = {};
    metrics.forEach(m => {
      if (!byDate[m.date]) byDate[m.date] = { ventas: 0, utilidad: 0, ads: 0, pedidos: 0 };
      const vn = m.ventas_brutas - m.descuentos - m.devoluciones;
      const cost = m.cogs + m.guias + m.comision_tts + m.iva_ads + m.retenciones + m.anuncios + m.costo_host + m.nomina + m.gastos_fijos;
      byDate[m.date].ventas += m.ventas_brutas;
      byDate[m.date].utilidad += vn - cost;
      byDate[m.date].ads += m.anuncios;
      byDate[m.date].pedidos += m.pedidos;
    });
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
  }, [metrics]);

  const last7 = dailyTotals.slice(-7);
  const sparkUtilidad = last7.map(([, v]) => v.utilidad);
  const sparkVentas = last7.map(([, v]) => v.ventas);
  const sparkAds = last7.map(([, v]) => v.ads);
  const sparkPedidos = last7.map(([, v]) => v.pedidos);

  // ─── Channel table data ───
  const channelData = useMemo(() => {
    const byCanal: Record<string, { ventas: number; ads: number; pedidos: number; profit: number; daily: number[] }> = {};
    const dateSet = new Set<string>();
    metrics.forEach(m => {
      dateSet.add(m.date);
      if (!byCanal[m.canal]) byCanal[m.canal] = { ventas: 0, ads: 0, pedidos: 0, profit: 0, daily: [] };
      byCanal[m.canal].ventas += m.ventas_brutas;
      byCanal[m.canal].ads += m.anuncios;
      byCanal[m.canal].pedidos += m.pedidos;
      const vn = m.ventas_brutas - m.descuentos - m.devoluciones;
      const cost = m.cogs + m.guias + m.comision_tts + m.iva_ads + m.retenciones + m.anuncios + m.gastos_fijos;
      byCanal[m.canal].profit += vn - cost;
    });

    // Build daily arrays per canal
    const sortedDates = [...dateSet].sort();
    Object.keys(byCanal).forEach(canal => {
      byCanal[canal].daily = sortedDates.map(date => {
        return metrics.filter(m => m.canal === canal && m.date === date).reduce((s, m) => s + m.ventas_brutas, 0);
      });
    });

    return Object.entries(byCanal).map(([canal, d]) => {
      const kpi = kpis.find(k => {
        const mapped = KPI_CANAL_MAP[k.kpi_slug];
        return mapped === canal;
      });
      const meta = kpi?.valor_target || 0;
      const avance = meta ? (d.ventas / meta) * 100 : 0;
      const roas = d.ads ? d.ventas / d.ads : 0;
      const last7d = d.daily.slice(-7);
      const prev7d = d.daily.slice(-14, -7);
      const sumLast = last7d.reduce((a, b) => a + b, 0);
      const sumPrev = prev7d.reduce((a, b) => a + b, 0);
      const trendPct = sumPrev ? ((sumLast - sumPrev) / sumPrev) * 100 : 0;

      return { canal, ventas: d.ventas, meta, avance, ads: d.ads, roas, profit: d.profit, pedidos: d.pedidos, trendPct, sparkData: d.daily.slice(-7) };
    });
  }, [metrics, kpis]);

  const sortedChannels = useMemo(() => {
    const sorted = [...channelData].sort((a, b) => {
      const va = (a as any)[sortCol] ?? 0;
      const vb = (b as any)[sortCol] ?? 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return sorted;
  }, [channelData, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  // ─── Area chart data ───
  const areaData = useMemo(() => {
    return dailyTotals.map(([date, v]) => ({
      date: date.slice(5).replace('-', '/'),
      fullDate: date,
      ventas: Math.round(v.ventas),
      utilidad: Math.round(v.utilidad),
    }));
  }, [dailyTotals]);

  // ─── Pie chart data ───
  const pieData = useMemo(() => {
    const byCanal: Record<string, number> = {};
    metrics.forEach(m => { byCanal[m.canal] = (byCanal[m.canal] || 0) + m.ventas_brutas; });
    const total = Object.values(byCanal).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(byCanal)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value, pct: ((value / total) * 100).toFixed(1), color: CANAL_COLORS[name] || '#6B7280' }));
  }, [metrics]);

  // ─── Profit bar chart ───
  const profitBarData = useMemo(() => {
    return [...channelData]
      .sort((a, b) => b.profit - a.profit)
      .map(c => ({ canal: c.canal, profit: Math.round(c.profit), fill: c.profit >= 0 ? '#22c55e' : '#ef4444' }));
  }, [channelData]);

  const accentColor = isFI ? 'hsl(14,100%,57%)' : 'hsl(160,76%,36%)';
  const brandLabel = isFI ? 'Feel Ink' : 'Skinglow';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground animate-pulse">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── HERO: 2 big cards ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Utilidad Card */}
        <div className="bg-card rounded-lg border border-border p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Utilidad del Mes</p>
            <div className={`text-4xl font-medium ${margen >= 20 ? 'text-emerald-400' : margen >= 14 ? 'text-yellow-400' : 'text-red-400'}`}>
              {formatMXN(utilidad)}
            </div>
            <p className={`text-sm mt-1 ${margen >= 20 ? 'text-emerald-400/70' : margen >= 14 ? 'text-yellow-400/70' : 'text-red-400/70'}`}>
              {formatPct(margen)} margen
            </p>
          </div>
          <div className="flex items-end justify-between mt-4">
            <SparkLine data={sparkUtilidad} color={margen >= 20 ? '#22c55e' : margen >= 14 ? '#eab308' : '#ef4444'} height={40} />
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">vs mes anterior</p>
              <ChangeBadge current={utilidad} previous={utilidad * 0.85} />
            </div>
          </div>
        </div>

        {/* Ventas vs Meta Card */}
        <div className="bg-card rounded-lg border border-border p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Ventas Brutas vs Meta</p>
            <div className="text-4xl font-medium text-foreground">{formatMXN(ventasBrutas)}</div>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{formatPct(avanceMeta)} de meta ({formatMXN(metaVentas)})</span>
                <span>Día {daysPassed}/{daysInMonth}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${Math.min(100, avanceMeta)}%` }} />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            {daysLeft > 0 ? `Necesitas ${formatMXN(ventasDiariasNecesarias)}/día para cubrir la meta` : 'Último día del mes'}
          </p>
        </div>
      </div>

      {/* ─── 4 KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Gasto en Ads" value={formatMXN(gastoAds)} sparkData={sparkAds} sparkColor="#F59E0B" icon={<DollarSign size={14} />} />
        <KPICard label="ROAS Blended" value={formatROAS(roasBlended)} sparkData={sparkVentas} sparkColor={accentColor} icon={<Target size={14} />} />
        <KPICard label="Pedidos" value={pedidosTotal.toLocaleString()} sparkData={sparkPedidos} sparkColor="#8B5CF6" icon={<ShoppingCart size={14} />} />
        <KPICard label="Ticket Promedio" value={formatMXN(ticketPromedio)} sparkData={[]} sparkColor="#06B6D4" icon={<BarChart3 size={14} />} />
      </div>

      {/* ─── CHANNEL TABLE ─── */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Rendimiento por Canal</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{periodo} · {brandLabel}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/20">
                <th className="text-left py-2.5 pl-5 pr-3 font-medium">Canal</th>
                <SortTh label="Ventas MTD" col="ventas" sortCol={sortCol} sortDir={sortDir} onClick={handleSort} />
                <th className="text-right py-2.5 px-3 font-medium">Meta Mes</th>
                <th className="text-right py-2.5 px-3 font-medium">% Avance</th>
                <SortTh label="Gasto Ads" col="ads" sortCol={sortCol} sortDir={sortDir} onClick={handleSort} />
                <SortTh label="ROAS" col="roas" sortCol={sortCol} sortDir={sortDir} onClick={handleSort} />
                <SortTh label="Profit" col="profit" sortCol={sortCol} sortDir={sortDir} onClick={handleSort} />
                <SortTh label="Pedidos" col="pedidos" sortCol={sortCol} sortDir={sortDir} onClick={handleSort} />
                <th className="text-center py-2.5 px-3 font-medium">Tend.</th>
              </tr>
            </thead>
            <tbody>
              {sortedChannels.map((ch, i) => (
                <tr key={ch.canal} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${i % 2 === 1 ? 'bg-secondary/10' : ''}`}>
                  <td className="py-2.5 pl-5 pr-3 font-medium text-foreground whitespace-nowrap">
                    <span className="mr-1.5">{CANAL_ICONS[ch.canal] || '📊'}</span>{ch.canal}
                  </td>
                  <td className="py-2.5 px-3 text-right text-foreground tabular-nums">{formatMXN(ch.ventas)}</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">{ch.meta ? formatMXN(ch.meta) : '—'}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${ch.avance >= 80 ? 'bg-emerald-500' : ch.avance >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, ch.avance)}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground w-10 text-right">{ch.meta ? formatPct(ch.avance) : '—'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">{formatMXN(ch.ads)}</td>
                  <td className="py-2.5 px-3 text-right text-foreground tabular-nums">{ch.ads ? formatROAS(ch.roas) : '—'}</td>
                  <td className={`py-2.5 px-3 text-right tabular-nums font-medium ${ch.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatMXN(ch.profit)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-foreground tabular-nums">{ch.pedidos.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center">
                    {ch.trendPct > 5 ? <TrendingUp size={14} className="inline text-emerald-400" /> :
                     ch.trendPct < -5 ? <TrendingDown size={14} className="inline text-red-400" /> :
                     <span className="text-muted-foreground text-xs">→</span>}
                  </td>
                </tr>
              ))}
              {/* TOTAL row */}
              <tr className="border-t-2 border-border font-medium bg-secondary/20">
                <td className="py-2.5 pl-5 pr-3 text-foreground">TOTAL</td>
                <td className="py-2.5 px-3 text-right text-foreground tabular-nums">{formatMXN(channelData.reduce((s, c) => s + c.ventas, 0))}</td>
                <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">{formatMXN(metaVentas)}</td>
                <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">{metaVentas ? formatPct(avanceMeta) : '—'}</td>
                <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">{formatMXN(gastoAds)}</td>
                <td className="py-2.5 px-3 text-right text-foreground tabular-nums">{gastoAds ? formatROAS(roasBlended) : '—'}</td>
                <td className={`py-2.5 px-3 text-right tabular-nums font-medium ${utilidad >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatMXN(utilidad)}
                </td>
                <td className="py-2.5 px-3 text-right text-foreground tabular-nums">{pedidosTotal.toLocaleString()}</td>
                <td className="py-2.5 px-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── CHARTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area Chart - Tendencia Diaria */}
        <div className="bg-card rounded-lg border border-border p-5 lg:col-span-1">
          <h3 className="text-sm font-medium text-foreground mb-1">Tendencia Diaria</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Ventas brutas + Utilidad</p>
          {areaData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-16 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,18%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,18%)', borderRadius: 8, fontSize: 12, color: '#fff' }}
                  formatter={(value: number, name: string) => [formatMXN(value), name === 'ventas' ? 'Ventas' : 'Utilidad']}
                />
                <Area type="monotone" dataKey="ventas" stroke={accentColor} strokeWidth={2} fill="url(#gradVentas)" name="ventas" />
                <Line type="monotone" dataKey="utilidad" stroke="#22c55e" strokeWidth={2} dot={false} name="utilidad" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right column: Pie + Bar */}
        <div className="space-y-4">
          {/* Pie Chart */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-3">Mix por Canal</h3>
            {pieData.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Sin datos</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" stroke="none">
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-medium text-foreground">{formatMXN(ventasBrutas)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-xs min-w-0">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground truncate">{d.name}</span>
                      <span className="text-foreground ml-auto tabular-nums">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profit Bar Chart */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-3">Profit por Canal</h3>
            {profitBarData.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, profitBarData.length * 28)}>
                <BarChart data={profitBarData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="canal" tick={{ fontSize: 10, fill: 'hsl(0,0%,70%)' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,18%)', borderRadius: 8, fontSize: 12, color: '#fff' }}
                    formatter={(value: number) => [formatMXN(value), 'Profit']}
                  />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                    {profitBarData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function KPICard({ label, value, sparkData, sparkColor, icon }: {
  label: string; value: string; sparkData: number[]; sparkColor: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex items-end justify-between mt-2">
        <span className="text-xl font-medium text-foreground">{value}</span>
        {sparkData.length >= 2 && <SparkLine data={sparkData} color={sparkColor} height={28} />}
      </div>
    </div>
  );
}

function SortTh({ label, col, sortCol, sortDir, onClick }: {
  label: string; col: string; sortCol: string; sortDir: string; onClick: (col: string) => void;
}) {
  return (
    <th className="text-right py-2.5 px-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onClick(col)}>
      {label} {sortCol === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );
}
