import { useAppStore } from '@/store/useAppStore';
import { useLives, useKPIs, useOKRs, useAgentConversations, useDailyMetrics } from '@/hooks/useSupabaseData';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, Sparkles, Video as VideoIcon, ShoppingCart, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';

const CHART_COLORS = ['hsl(14,100%,57%)', 'hsl(217,91%,60%)', 'hsl(142,71%,45%)', 'hsl(0,0%,50%)'];

export default function Dashboard() {
  const { activeBrand } = useAppStore();
  const isFI = activeBrand === 'feel_ink';
  const { data: lives } = useLives();
  const { data: kpis } = useKPIs();
  const { data: okrs } = useOKRs();
  const { data: conversations } = useAgentConversations();
  const { data: metrics } = useDailyMetrics();

  const directorAnalysis = conversations?.find(c => c.agent_id === 'director')?.last_analysis;

  // Compute profit panel from lives data
  const profitData = useMemo(() => {
    if (!lives?.length) return null;
    const totalVentas = lives.reduce((s, l) => s + (l.venta || 0), 0);
    const totalAds = lives.reduce((s, l) => s + (l.ads || 0), 0);
    const totalMercancias = lives.reduce((s, l) => s + (l.mercancias || 0), 0);
    const totalHost = lives.reduce((s, l) => s + (l.costo_host || 0), 0);
    // Formula: COGS12% + guías6% + comisiónTTS8% + IVACPA4% + retenciones9.03% + ads + host
    const totalCostsCalc = totalVentas * 0.12 + totalVentas * 0.06 + totalVentas * 0.08 + totalAds * 0.04 + totalVentas * 0.0903 + totalAds + totalHost;
    const profit = totalVentas - totalCostsCalc;
    return { ventas: totalVentas, costos: totalCostsCalc, ads: totalAds, profit, margen: totalVentas ? profit / totalVentas : 0 };
  }, [lives]);

  // Compute sales chart from lives (reverse chronological)
  const salesChartData = useMemo(() => {
    if (!lives?.length) return [];
    return [...lives].reverse().map(l => {
      const ventas = l.venta || 0;
      const ads = l.ads || 0;
      const costos = ventas * 0.3903 + ads * 1.04 + (l.costo_host || 0);
      return {
        date: l.fecha?.slice(5) || '',
        ventas,
        profit: ventas - costos,
      };
    });
  }, [lives]);

  // Channel distribution from metrics
  const channelDistribution = useMemo(() => {
    if (!metrics?.length) {
      return [
        { name: 'TikTok Shop', value: 42, amount: 52080 },
        { name: 'Meta Ads', value: 28, amount: 34720 },
        { name: 'Shopify Org.', value: 15, amount: 18600 },
        { name: 'Mayoreo', value: 15, amount: 18600 },
      ];
    }
    const byCanal: Record<string, number> = {};
    metrics.forEach(m => { byCanal[m.canal] = (byCanal[m.canal] || 0) + (m.ventas_brutas || 0); });
    const total = Object.values(byCanal).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(byCanal).map(([name, amount]) => ({
      name,
      value: Math.round((amount / total) * 100),
      amount: Math.round(amount),
    }));
  }, [metrics]);

  const totalChannel = channelDistribution.reduce((s, c) => s + c.amount, 0);

  // OKR data
  const okrItems = useMemo(() => {
    if (!okrs?.length) return [];
    const okr = okrs[0];
    const items = (okr.kr_items as any[]) || [];
    return items.map((kr: any) => ({
      name: kr.name,
      current: kr.actual,
      target: kr.meta,
      unit: kr.unidad,
    }));
  }, [okrs]);

  // KPI summaries
  const getKpi = (slug: string) => kpis?.find(k => k.kpi_slug === slug);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite · Dashboard</p>
        <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
      </div>

      {/* Profit Panel */}
      {profitData && (
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ventas Brutas</span>
              <div className="text-xl font-medium text-foreground">{formatMXN(profitData.ventas)}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Costos Totales</span>
              <div className="text-xl font-medium text-foreground">{formatMXN(profitData.costos)}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Gasto Ads</span>
              <div className="text-xl font-medium text-foreground">{formatMXN(profitData.ads)}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit Estimado</span>
              <div className="text-xl font-medium text-primary">{formatMXN(profitData.profit)}</div>
              <span className="text-xs text-muted-foreground">{formatPct(profitData.margen * 100)} margen</span>
            </div>
          </div>
          {/* Break-even bar */}
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (profitData.ventas / (profitData.costos || 1)) * 50)}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground">Break-even</span>
            <span className="text-[9px] text-primary">{profitData.profit > 0 ? '✓ Por encima' : '⚠ Por debajo'}</span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isFI ? (
          <>
            <KpiCard label="Ventas Totales" value={formatMXN(getKpi('ventas_totales')?.valor_actual || 0)} sub={`Meta: ${formatMXN(getKpi('ventas_totales')?.valor_target || 0)}`} icon={<TrendingUp size={16} />} status={getKpi('ventas_totales')?.status as any} />
            <KpiCard label="ROAS Promedio" value={formatROAS(getKpi('roas_avg')?.valor_actual || 0)} sub="Promedio hist." icon={<Clock size={16} />} status={getKpi('roas_avg')?.status as any} />
            <KpiCard label="% Utilidad" value={formatPct(getKpi('pct_utilidad')?.valor_actual || 0)} sub={`Meta: ${formatPct(getKpi('pct_utilidad')?.valor_target || 0)}`} icon={<AlertTriangle size={16} />} status={getKpi('pct_utilidad')?.status as any} />
            <KpiCard label="Ticket Promedio" value={formatMXN(getKpi('ticket_promedio')?.valor_actual || 0)} sub={`Meta: ${formatMXN(getKpi('ticket_promedio')?.valor_target || 0)}`} icon={<CheckCircle size={16} />} status={getKpi('ticket_promedio')?.status as any} />
          </>
        ) : (
          <>
            <KpiCard label="Ventas Totales" value={formatMXN(getKpi('ventas_totales')?.valor_actual || 0)} sub={`Meta: ${formatMXN(getKpi('ventas_totales')?.valor_target || 0)}`} icon={<TrendingUp size={16} />} status={getKpi('ventas_totales')?.status as any} />
            <KpiCard label="% Descuento" value={formatPct(getKpi('pct_descuento')?.valor_actual || 0)} sub={`Meta <${formatPct(getKpi('pct_descuento')?.valor_target || 0)}`} icon={<AlertTriangle size={16} />} status={getKpi('pct_descuento')?.status as any} />
            <KpiCard label="% Retención" value={formatPct(getKpi('pct_retencion')?.valor_actual || 0)} sub={`Meta >${formatPct(getKpi('pct_retencion')?.valor_target || 0)}`} icon={<AlertTriangle size={16} />} status={getKpi('pct_retencion')?.status as any} />
            <KpiCard label="Break-even Daily" value={formatMXN(getKpi('break_even_daily')?.valor_actual || 0)} sub="Superado" icon={<CheckCircle size={16} />} status={getKpi('break_even_daily')?.status as any} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">Ventas vs Profit</h3>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Por sesión de live</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesChartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(0,0%,10%)', border: '1px solid hsl(0,0%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="ventas" stroke="hsl(14,100%,57%)" strokeWidth={2} dot={false} name="Ventas" />
              <Line type="monotone" dataKey="profit" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground">Distribución por canal</h3>
          <div className="flex items-center justify-center mt-2">
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={channelDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={78} dataKey="value" stroke="none">
                    {channelDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-medium text-foreground">{formatMXN(totalChannel)}</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Total</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {channelDistribution.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {c.name} ({c.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Director Panel */}
      <div className="bg-card rounded-lg border border-primary/30 p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Análisis del Director — {isFI ? 'Feel Ink' : 'Skinglow'} · Período actual</h3>
            <span className="text-[9px] uppercase tracking-[0.15em] text-primary font-medium">Recomendación prioritaria</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {directorAnalysis || 'Conecta el agente IA Director para obtener análisis automatizado de tu negocio. Ve a Agentes IA → Director → Chat para iniciar.'}
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg" onClick={() => window.location.href = '/agentes'}>
            Ver análisis completo →
          </button>
        </div>
      </div>

      {/* OKRs + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">OKRs del período</h3>
          <div className="space-y-4">
            {okrItems.map((okr) => (
              <div key={okr.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="uppercase tracking-wider text-muted-foreground font-medium">{okr.name}</span>
                  <span className="text-foreground">
                    {okr.unit === 'x' ? `${okr.current}x / ${okr.target}x` :
                     okr.unit === '%' ? `${okr.current}% / ${okr.target}%` :
                     `${formatMXN(okr.current)} / ${formatMXN(okr.target)}`}
                    {' '}({Math.round((okr.current / okr.target) * 100)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (okr.current / okr.target) * 100)}%` }} />
                </div>
              </div>
            ))}
            {!okrItems.length && <p className="text-xs text-muted-foreground">Sin OKRs para el período actual.</p>}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Actividad reciente</h3>
          <div className="space-y-4">
            {(lives || []).slice(0, 4).map((l, i) => (
              <div key={l.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <VideoIcon size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Live {l.host || 'Sin host'}</span>
                    <span className="text-[10px] text-muted-foreground">{l.fecha}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatMXN(l.venta || 0)} venta · ROAS {formatROAS(l.roas_live || 0)} · {l.pedidos} pedidos
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, status }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  status?: 'bien' | 'alerta' | 'critico' | string | null;
}) {
  const statusColor = status === 'bien' ? 'text-status-good' : status === 'alerta' ? 'text-status-warning' : status === 'critico' ? 'text-status-critical' : 'text-muted-foreground';
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className={statusColor}>{icon}</span>
      </div>
      <div className="text-2xl font-medium text-foreground">{value}</div>
      <p className={`text-xs mt-1 ${statusColor}`}>{sub}</p>
    </div>
  );
}
