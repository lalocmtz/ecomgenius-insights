import { useAppStore } from '@/store/useAppStore';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import { salesData30d, channelDistribution, agents } from '@/data/mockData';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, Sparkles, Video as VideoIcon, ShoppingCart, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['hsl(14,100%,57%)', 'hsl(217,91%,60%)', 'hsl(142,71%,45%)', 'hsl(0,0%,50%)'];

export default function Dashboard() {
  const { activeBrand } = useAppStore();
  const isFI = activeBrand === 'feel_ink';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite · Dashboard</p>
        <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isFI ? (
          <>
            <KpiCard label="Ventas Hoy" value={formatMXN(42300)} sub="vs ayer: $37,760" icon={<TrendingUp size={16} />} trend="up" />
            <KpiCard label="ROAS Lives" value={formatROAS(4.02)} sub="Promedio hist." icon={<Clock size={16} />} />
            <KpiCard label="Margen Neto" value={formatPct(2.04)} sub="Bajo meta" icon={<AlertTriangle size={16} />} status="warning" />
            <KpiCard label="Precisión" value="TrueProfit 100%" sub="Auditoría en tiempo real" icon={<CheckCircle size={16} />} status="good" />
          </>
        ) : (
          <>
            <KpiCard label="Ventas Shopify Hoy" value={formatMXN(28500)} sub="vs ayer: $25,200" icon={<TrendingUp size={16} />} trend="up" />
            <KpiCard label="Ticket Promedio" value={formatMXN(1021)} sub="+3.2% vs mes ant." icon={<CreditCard size={16} />} />
            <KpiCard label="% Descuento" value={formatPct(33.9)} sub="Meta <25%" icon={<AlertTriangle size={16} />} status="critical" />
            <KpiCard label="Break-even Daily" value={formatMXN(12400)} sub="Superado diario" icon={<CheckCircle size={16} />} status="good" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Ventas de los últimos 30 días</h3>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Proyección vs objetivo real</p>
            </div>
            <div className="flex gap-1 bg-secondary rounded-full p-0.5">
              {['7D', '30D', '3M', 'YTD'].map((f) => (
                <button key={f} className={`px-3 py-1 text-[10px] rounded-full ${f === '30D' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesData30d}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(0,0%,10%)', border: '1px solid hsl(0,0%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="ventas" stroke="hsl(14,100%,57%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="meta" stroke="hsl(0,0%,40%)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground">Distribución por canal</h3>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cuota de mercado interna</p>
          <div className="flex items-center justify-center mt-2">
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={channelDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={78} dataKey="value" stroke="none">
                    {channelDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-medium text-foreground">$124K</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Total mensual</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {channelDistribution.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
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
            <h3 className="text-sm font-medium text-foreground">Análisis del Director — {isFI ? 'Feel Ink' : 'Skinglow'} · Hoy</h3>
            <span className="text-[9px] uppercase tracking-[0.15em] text-primary font-medium">Recomendación prioritaria</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {agents[0].lastAnalysis}
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg">
            Ver análisis completo →
          </button>
          <button className="px-4 py-2 text-xs font-medium border border-border text-foreground rounded-lg hover:bg-secondary">
            Actualizar análisis
          </button>
        </div>
      </div>

      {/* OKRs + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">OKRs del mes</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Q4 - Octubre</span>
          </div>
          <div className="space-y-4">
            {[
              { name: 'GMV TikTok', current: 85000, target: 100000 },
              { name: 'ROAS Meta', current: 3.4, target: 4.0, unit: 'x' },
              { name: 'Margen Neto', current: 2.04, target: 15, unit: '%' },
            ].map((okr) => (
              <div key={okr.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="uppercase tracking-wider text-muted-foreground font-medium">{okr.name}</span>
                  <span className="text-foreground">
                    {okr.unit === 'x' ? `${okr.current}X / ${okr.target}X` :
                     okr.unit === '%' ? `${okr.current}% / ${okr.target}%` :
                     `${formatMXN(okr.current)} / ${formatMXN(okr.target)}`}
                    {' '}({Math.round((okr.current / okr.target) * 100)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, (okr.current / okr.target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Actividad reciente</h3>
            <button className="text-[10px] uppercase tracking-wider text-primary font-medium">Ver todo</button>
          </div>
          <div className="space-y-4">
            {[
              { icon: VideoIcon, title: 'Live iniciado', desc: 'TikTok Shop: "Evening Routine with Feel Ink" por @alex.ink', time: 'Hace 2m' },
              { icon: Sparkles, title: 'Campaña actualizada', desc: 'Meta Ads: Aumento de presupuesto +20% en "Retargeting Q4"', time: 'Hace 45m' },
              { icon: ShoppingCart, title: 'Stock bajo', desc: 'SKU: FI-SERUM-01 (Ink Serum Gold). Qty: 12 unidades.', time: 'Hace 2h' },
              { icon: CreditCard, title: 'Pago recibido', desc: 'Dispersión de TikTok Shop: $12,450.20 transferido a BBVA.', time: 'Hace 3h' },
            ].map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <act.icon size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{act.title}</span>
                    <span className="text-[10px] text-muted-foreground">{act.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, status, trend }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  status?: 'good' | 'warning' | 'critical'; trend?: 'up' | 'down';
}) {
  const statusColor = status === 'good' ? 'text-status-good' : status === 'warning' ? 'text-status-warning' : status === 'critical' ? 'text-status-critical' : 'text-muted-foreground';
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className={statusColor}>{icon}</span>
      </div>
      <div className="text-2xl font-medium text-foreground">{value}</div>
      <p className={`text-xs mt-1 ${statusColor}`}>
        {trend === 'up' && '↑ '}{sub}
      </p>
    </div>
  );
}
