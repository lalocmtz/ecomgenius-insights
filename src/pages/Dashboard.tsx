import { useAppStore } from '@/store/useAppStore';
import { useDashboardData, KPI_CANAL_MAP, calcVentasNetas, calcCostos, calcGastoAds, type MetricRow } from '@/hooks/useDashboardData';
import { formatMXN, formatPct } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Flame, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo, useState } from 'react';

const CHART_COLORS = ['hsl(14,100%,57%)', 'hsl(217,91%,60%)', 'hsl(142,71%,45%)', 'hsl(45,93%,47%)', 'hsl(280,67%,55%)', 'hsl(0,0%,50%)'];

function margenColor(margen: number) {
  if (margen >= 20) return 'text-status-good';
  if (margen >= 14) return 'text-status-warning';
  return 'text-status-critical';
}

function statusDot(status: string | null) {
  const color = status === 'bien' ? 'bg-[#22c55e]' : status === 'alerta' ? 'bg-[#eab308]' : status === 'critico' ? 'bg-[#ef4444]' : 'bg-muted-foreground';
  return <div className={`w-2 h-2 rounded-full ${color}`} />;
}

export default function Dashboard() {
  const { activeBrand } = useAppStore();
  const isFI = activeBrand === 'feel_ink';
  const { metrics, kpis, isLoading, periodo } = useDashboardData(activeBrand);

  // ─── Totals ───
  const ventasNetas = calcVentasNetas(metrics);
  const costos = calcCostos(metrics);
  const gastoAds = calcGastoAds(metrics);
  const utilidad = ventasNetas - costos;
  const margen = ventasNetas ? (utilidad / ventasNetas) * 100 : 0;

  // ─── Section 2: Objectives Table ───
  const objetivos = useMemo(() => {
    return kpis
      .filter(k => k.kpi_slug in KPI_CANAL_MAP)
      .map(kpi => {
        const canal = KPI_CANAL_MAP[kpi.kpi_slug];
        const canalMetrics = metrics.filter(m => m.canal === canal);
        const actualMTD = canalMetrics.reduce((s, m) => s + m.ventas_brutas, 0);
        const target = kpi.valor_target || 0;
        const avance = target ? (actualMTD / target) * 100 : 0;

        // Trend: last 7 vs prev 7
        const sorted = [...canalMetrics].sort((a, b) => a.date.localeCompare(b.date));
        const last7 = sorted.slice(-7).reduce((s, m) => s + m.ventas_brutas, 0);
        const prev7 = sorted.slice(-14, -7).reduce((s, m) => s + m.ventas_brutas, 0);
        const trendPct = prev7 ? ((last7 - prev7) / prev7) * 100 : 0;
        const trend: 'up' | 'down' | 'stable' = trendPct > 5 ? 'up' : trendPct < -5 ? 'down' : 'stable';

        return { canal, kpiName: kpi.kpi_name, target, actualMTD, avance, status: kpi.status, trend };
      });
  }, [kpis, metrics]);

  const totalTarget = objetivos.reduce((s, o) => s + o.target, 0);
  const totalActual = objetivos.reduce((s, o) => s + o.actualMTD, 0);
  const totalAvance = totalTarget ? (totalActual / totalTarget) * 100 : 0;

  const semaforos = useMemo(() => {
    const counts = { bien: 0, alerta: 0, critico: 0 };
    objetivos.forEach(o => { if (o.status && o.status in counts) counts[o.status as keyof typeof counts]++; });
    return counts;
  }, [objetivos]);

  // ─── Section 3: Charts ───
  const [chartTab, setChartTab] = useState<'7D' | '30D' | 'MTD'>('MTD');

  const chartData = useMemo(() => {
    const byDate: Record<string, { ventas: number; utilidad: number }> = {};
    metrics.forEach(m => {
      if (!byDate[m.date]) byDate[m.date] = { ventas: 0, utilidad: 0 };
      const vn = (m.ventas_brutas || 0) - (m.descuentos || 0) - (m.devoluciones || 0);
      const cost = (m.cogs || 0) + (m.guias || 0) + (m.comision_tts || 0) + (m.iva_ads || 0) + (m.retenciones || 0) + (m.anuncios || 0) + (m.costo_host || 0) + (m.nomina || 0) + (m.gastos_fijos || 0);
      byDate[m.date].ventas += vn;
      byDate[m.date].utilidad += vn - cost;
    });
    let entries = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
      date: date.slice(5),
      ventas: Math.round(v.ventas),
      utilidad: Math.round(v.utilidad),
    }));
    if (chartTab === '7D') entries = entries.slice(-7);
    else if (chartTab === '30D') entries = entries.slice(-30);
    return entries;
  }, [metrics, chartTab]);

  const channelMix = useMemo(() => {
    const byCanal: Record<string, number> = {};
    metrics.forEach(m => { byCanal[m.canal] = (byCanal[m.canal] || 0) + m.ventas_brutas; });
    const sorted = Object.entries(byCanal).sort(([, a], [, b]) => b - a);
    const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
    return sorted.slice(0, 5).map(([name, amount]) => ({
      name,
      value: Math.round((amount / total) * 100),
      amount: Math.round(amount),
    }));
  }, [metrics]);

  const totalChannelMix = channelMix.reduce((s, c) => s + c.amount, 0);

  // ─── Section 4: Top today + Alerts ───
  const lastDate = metrics.length ? metrics[metrics.length - 1]?.date : null;
  const todayMetrics = lastDate ? metrics.filter(m => m.date === lastDate) : [];

  const topCanales = useMemo(() => {
    const byCanal: Record<string, { ventas: number; pedidos: number }> = {};
    todayMetrics.forEach(m => {
      if (!byCanal[m.canal]) byCanal[m.canal] = { ventas: 0, pedidos: 0 };
      byCanal[m.canal].ventas += m.ventas_brutas;
      byCanal[m.canal].pedidos += m.pedidos;
    });
    // Avg daily per canal
    const avgByCanal: Record<string, number> = {};
    metrics.forEach(m => {
      avgByCanal[m.canal] = (avgByCanal[m.canal] || 0) + m.ventas_brutas;
    });
    const days = new Set(metrics.map(m => m.date)).size || 1;
    Object.keys(avgByCanal).forEach(k => { avgByCanal[k] /= days; });

    return Object.entries(byCanal)
      .sort(([, a], [, b]) => b.ventas - a.ventas)
      .slice(0, 3)
      .map(([canal, v]) => ({
        canal,
        ventas: v.ventas,
        pedidos: v.pedidos,
        aboveAvg: v.ventas > (avgByCanal[canal] || 0),
      }));
  }, [todayMetrics, metrics]);

  const alertas = useMemo(() => {
    const list: { icon: React.ReactNode; text: string; type: 'warning' | 'danger' | 'success' }[] = [];
    if (margen < 14 && metrics.length) list.push({ icon: <AlertTriangle size={14} />, text: '⚠️ Margen crítico', type: 'danger' });

    // Check channels falling 3+ days
    const byCanal: Record<string, number[]> = {};
    const sortedAll = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
    sortedAll.forEach(m => {
      if (!byCanal[m.canal]) byCanal[m.canal] = [];
      const idx = byCanal[m.canal].length;
      byCanal[m.canal][idx] = m.ventas_brutas;
    });

    // Canales with ventas > 2x avg
    const days = new Set(metrics.map(m => m.date)).size || 1;
    Object.entries(byCanal).forEach(([canal, vals]) => {
      const avg = vals.reduce((a, b) => a + b, 0) / days;
      const lastVal = vals[vals.length - 1] || 0;
      if (lastVal > avg * 2 && list.length < 5) list.push({ icon: <Flame size={14} />, text: `🔥 ${canal} excepcional`, type: 'success' });
      // Check falling 3+ consecutive
      if (vals.length >= 3) {
        const tail = vals.slice(-3);
        if (tail[2] < tail[1] && tail[1] < tail[0] && list.length < 5) {
          list.push({ icon: <ArrowDown size={14} />, text: `↓ ${canal} cayendo`, type: 'warning' });
        }
      }
    });

    return list.slice(0, 5);
  }, [metrics, margen]);

  const brandLabel = isFI ? 'Feel Ink' : 'Skinglow';
  const accentStroke = isFI ? 'hsl(14,100%,57%)' : 'hsl(160,76%,36%)';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite · Dashboard</p>
          <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
        </div>
        <div className="text-sm text-muted-foreground">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite · Dashboard</p>
        <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
      </div>

      {/* ─── SECTION 1: Hero Utilidad MTD ─── */}
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            UTILIDAD DEL MES · {periodo.replace('-', ' ')} · {brandLabel}
          </span>
          <div className={`text-3xl font-medium mt-1 ${margenColor(margen)}`}>{formatMXN(utilidad)}</div>
          <span className={`text-xs ${margenColor(margen)}`}>margen {formatPct(margen)}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStat label="Ventas Brutas" value={formatMXN(ventasNetas)} />
          <MiniStat label="Gasto Ads" value={formatMXN(gastoAds)} />
          <MiniStat label="Costos Op" value={formatMXN(costos)} />
          <MiniStat label="Utilidad" value={formatMXN(utilidad)} accent />
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
            <span>Meta margen: 20%</span>
            <span>{formatPct(margen)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (margen / 20) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Tabla Objetivos por Canal ─── */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Objetivos por Canal · {periodo}</h3>
        {objetivos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin datos de KPIs para este período.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">Canal</th>
                    <th className="text-right py-2 px-3 font-medium">Meta Mes</th>
                    <th className="text-right py-2 px-3 font-medium">Actual MTD</th>
                    <th className="text-right py-2 px-3 font-medium">% Avance</th>
                    <th className="text-center py-2 px-3 font-medium">Estado</th>
                    <th className="text-center py-2 px-3 font-medium">Tend.</th>
                  </tr>
                </thead>
                <tbody>
                  {objetivos.map((o, i) => (
                    <tr key={o.canal} className={i % 2 === 1 ? 'bg-secondary/30' : ''}>
                      <td className="py-2 pr-4 font-medium text-foreground">{o.canal}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{formatMXN(o.target)}</td>
                      <td className="py-2 px-3 text-right text-foreground">{formatMXN(o.actualMTD)}</td>
                      <td className="py-2 px-3 text-right text-foreground">{formatPct(o.avance)}</td>
                      <td className="py-2 px-3 flex justify-center">{statusDot(o.status)}</td>
                      <td className="py-2 px-3 text-center">
                        {o.trend === 'up' ? <TrendingUp size={14} className="inline text-status-good" /> :
                         o.trend === 'down' ? <TrendingDown size={14} className="inline text-status-critical" /> :
                         <Minus size={14} className="inline text-muted-foreground" />}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-medium">
                    <td className="py-2 pr-4 text-foreground">TOTAL</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{formatMXN(totalTarget)}</td>
                    <td className="py-2 px-3 text-right text-foreground">{formatMXN(totalActual)}</td>
                    <td className="py-2 px-3 text-right text-foreground">{formatPct(totalAvance)}</td>
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3" />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span>🟢 {semaforos.bien}</span>
              <span>🟡 {semaforos.alerta}</span>
              <span>🔴 {semaforos.critico}</span>
            </div>
          </>
        )}
      </div>

      {/* ─── SECTION 3: Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">Ventas vs Utilidad</h3>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Por día</p>
            </div>
            <div className="flex gap-1">
              {(['7D', '30D', 'MTD'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${
                    chartTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {chartData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-12 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(0,0%,10%)', border: '1px solid hsl(0,0%,18%)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="ventas" stroke={accentStroke} strokeWidth={2} dot={false} name="Ventas Netas" />
                <Line type="monotone" dataKey="utilidad" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} name="Utilidad" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground">Mix por Canal</h3>
          {channelMix.length === 0 ? (
            <p className="text-xs text-muted-foreground py-12 text-center">Sin datos</p>
          ) : (
            <>
              <div className="flex items-center justify-center mt-2">
                <div className="relative">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={channelMix} cx="50%" cy="50%" innerRadius={55} outerRadius={78} dataKey="value" stroke="none">
                        {channelMix.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-medium text-foreground">{formatMXN(totalChannelMix)}</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Total</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {channelMix.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {c.name} ({c.value}%)
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── SECTION 4: Top Canales Hoy + Alertas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Top Canales · {lastDate?.slice(5) || 'Hoy'}</h3>
          {topCanales.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos de hoy.</p>
          ) : (
            <div className="space-y-3">
              {topCanales.map(tc => (
                <div key={tc.canal} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                  <div>
                    <span className="text-sm font-medium text-foreground">{tc.canal}</span>
                    <p className="text-xs text-muted-foreground">{tc.pedidos} pedidos</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">{formatMXN(tc.ventas)}</span>
                    {tc.aboveAvg && <span className="ml-2 text-[9px] uppercase tracking-wider text-status-good font-medium">▲ Arriba promedio</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Alertas</h3>
          {alertas.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin alertas activas. Todo operando normal.</p>
          ) : (
            <div className="space-y-3">
              {alertas.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg p-3 ${
                  a.type === 'danger' ? 'bg-status-critical/10' : a.type === 'success' ? 'bg-status-good/10' : 'bg-status-warning/10'
                }`}>
                  <span className={a.type === 'danger' ? 'text-status-critical' : a.type === 'success' ? 'text-status-good' : 'text-status-warning'}>
                    {a.icon}
                  </span>
                  <span className="text-sm text-foreground">{a.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className={`text-xl font-medium ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
