import { useDailyMetrics, useLives } from '@/hooks/useSupabaseData';
import { formatMXN, formatROAS } from '@/lib/formatters';
import { TrendingUp, ShoppingBag, CreditCard, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { useMemo } from 'react';

export default function TikTokShop() {
  const { data: metrics, isLoading } = useDailyMetrics('tiktok');
  const { data: lives } = useLives();

  const totals = useMemo(() => {
    if (!metrics?.length) return { gmv: 0, pedidos: 0, aov: 0, comision: 0 };
    const gmv = metrics.reduce((s, m) => s + (m.ventas_brutas || 0), 0);
    const pedidos = metrics.reduce((s, m) => s + (m.pedidos || 0), 0);
    const comision = metrics.reduce((s, m) => s + (m.comision_tts || 0), 0);
    return { gmv, pedidos, aov: pedidos ? gmv / pedidos : 0, comision };
  }, [metrics]);

  const liveDates = new Set((lives || []).map(l => l.fecha));
  const chartData = useMemo(() => {
    return (metrics || []).map(m => ({
      date: m.date.slice(5),
      gmv: m.ventas_brutas || 0,
      isLiveDay: liveDates.has(m.date),
    })).reverse();
  }, [metrics, liveDates]);

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary rounded" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-foreground">TikTok Shop</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="GMV Total" value={formatMXN(totals.gmv)} icon={<TrendingUp size={16} />} />
        <KpiCard label="Pedidos" value={String(totals.pedidos)} icon={<ShoppingBag size={16} />} />
        <KpiCard label="AOV" value={formatMXN(totals.aov)} icon={<CreditCard size={16} />} />
        <KpiCard label="Comisión TTS" value={formatMXN(totals.comision)} icon={<BarChart2 size={16} />} />
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">GMV 30D</h3>
        <p className="text-[10px] text-muted-foreground mb-2">● = día con live</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip />
            <Line type="monotone" dataKey="gmv" stroke="hsl(14,100%,57%)" strokeWidth={2} dot={(props: any) => props.payload.isLiveDay ? <Dot {...props} r={5} fill="hsl(14,100%,57%)" /> : <Dot {...props} r={0} />} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            {['Fecha', 'Ventas', 'Pedidos', 'Comisión', 'Ads'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {(metrics || []).map(m => (
              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/10">
                <td className="px-4 py-3 text-foreground">{m.date}</td>
                <td className="px-4 py-3 text-foreground">{formatMXN(m.ventas_brutas || 0, true)}</td>
                <td className="px-4 py-3 text-foreground">{m.pedidos}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatMXN(m.comision_tts || 0)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatMXN(m.anuncios || 0)}</td>
              </tr>
            ))}
            {!metrics?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin datos TikTok</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-2xl font-medium text-foreground">{value}</div>
    </div>
  );
}
