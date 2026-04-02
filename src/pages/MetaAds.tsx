import { useDailyMetrics, useCreativos } from '@/hooks/useSupabaseData';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import { Target, TrendingUp, CreditCard, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMemo } from 'react';

export default function MetaAds() {
  const { data: metrics, isLoading } = useDailyMetrics('meta');
  const { data: creativos } = useCreativos();

  const totals = useMemo(() => {
    if (!metrics?.length) return { spend: 0, roas: 0, cpa: 0, conversiones: 0 };
    const spend = metrics.reduce((s, m) => s + (m.anuncios || 0), 0);
    const revenue = metrics.reduce((s, m) => s + (m.ventas_brutas || 0), 0);
    const pedidos = metrics.reduce((s, m) => s + (m.pedidos || 0), 0);
    return { spend, roas: spend ? revenue / spend : 0, cpa: pedidos ? spend / pedidos : 0, conversiones: pedidos };
  }, [metrics]);

  const chartData = (metrics || []).map(m => ({
    date: m.date.slice(5),
    roas: (m.ventas_brutas || 0) / ((m.anuncios || 1)),
  })).reverse();

  const topCreativos = (creativos || []).filter(c => c.plataforma === 'meta').slice(0, 6);

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary rounded" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-foreground">Meta Ads</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Spend" value={formatMXN(totals.spend)} icon={<CreditCard size={16} />} />
        <KpiCard label="ROAS" value={formatROAS(totals.roas)} icon={<Target size={16} />} status={totals.roas >= 3.5 ? 'good' : 'warning'} />
        <KpiCard label="CPA" value={formatMXN(totals.cpa)} icon={<TrendingUp size={16} />} />
        <KpiCard label="Conversiones" value={String(totals.conversiones)} icon={<BarChart2 size={16} />} />
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">ROAS Diario</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <ReferenceLine y={3.5} stroke="hsl(0,0%,40%)" strokeDasharray="5 5" label={{ value: 'Target 3.5x', fill: 'hsl(0,0%,50%)', fontSize: 10 }} />
            <Line type="monotone" dataKey="roas" stroke="hsl(14,100%,57%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {topCreativos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Top Creativos por ROAS</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {topCreativos.map(c => {
              const borderColor = (c.roas || 0) > 5 ? 'border-status-good' : (c.roas || 0) > 3 ? 'border-status-warning' : 'border-status-critical';
              return (
                <div key={c.id} className={`bg-card rounded-lg border-2 ${borderColor} p-4`}>
                  <span className="text-sm font-medium text-foreground">{c.nombre}</span>
                  <p className="text-xs text-muted-foreground mt-1">{c.hook_text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-primary font-medium">ROAS {formatROAS(c.roas || 0)}</span>
                    <span className="text-xs text-muted-foreground">Spend {formatMXN(c.spend || 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, status }: { label: string; value: string; icon: React.ReactNode; status?: string }) {
  const color = status === 'good' ? 'text-status-good' : status === 'warning' ? 'text-status-warning' : 'text-foreground';
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className={`text-2xl font-medium ${color}`}>{value}</div>
    </div>
  );
}
