import { useState, useMemo } from 'react';
import { livesData } from '@/data/mockData';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import { Download, TrendingUp, Target, BarChart2, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const HOSTS = ['Todos', 'DENISSE', 'EMILIO', 'FER', 'KARO'];
const HOST_COLORS: Record<string, string> = { DENISSE: 'hsl(14,100%,57%)', EMILIO: 'hsl(217,91%,60%)', FER: 'hsl(142,71%,45%)', KARO: 'hsl(48,96%,53%)' };

export default function Lives() {
  const [hostFilter, setHostFilter] = useState('Todos');
  const [minRoas, setMinRoas] = useState(0);

  const filtered = useMemo(() => {
    return livesData.filter((l) => {
      if (hostFilter !== 'Todos' && l.host !== hostFilter) return false;
      if (l.roas_live < minRoas) return false;
      return true;
    });
  }, [hostFilter, minRoas]);

  const totalVentas = filtered.reduce((s, l) => s + l.venta, 0);
  const avgRoas = filtered.length ? filtered.reduce((s, l) => s + l.roas_live, 0) / filtered.length : 0;
  const avgMargen = filtered.length ? filtered.reduce((s, l) => s + l.margen, 0) / filtered.length : 0;
  const bestLive = filtered.reduce((b, l) => (l.venta > (b?.venta || 0) ? l : b), filtered[0]);

  const chartData = [...filtered].reverse().map((l) => ({
    name: l.fecha.slice(5),
    utilidad: l.utilidad,
  }));

  // Host stats
  const hostStats = useMemo(() => {
    const hosts = ['DENISSE', 'EMILIO', 'FER', 'KARO'];
    return hosts.map((h) => {
      const hLives = livesData.filter((l) => l.host === h);
      if (!hLives.length) return { host: h, roas: 0, margen: 0, mejor: 0 };
      return {
        host: h,
        roas: hLives.reduce((s, l) => s + l.roas_live, 0) / hLives.length,
        margen: hLives.reduce((s, l) => s + l.margen, 0) / hLives.length,
        mejor: Math.max(...hLives.map((l) => l.venta)),
      };
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Core v2.4</p>
          <h1 className="text-2xl font-medium text-foreground">Análisis de Lives — Feel Ink</h1>
          <p className="text-xs text-muted-foreground">Intelligence & Performance Tracking Dashboard</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary">
          <Download size={14} /> Exportar a CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Host</label>
          <select
            value={hostFilter}
            onChange={(e) => setHostFilter(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            {HOSTS.map((h) => <option key={h} value={h}>{h === 'Todos' ? 'Todos los Hosts' : h}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Periodo</label>
          <select className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <option>Últimos 30 días</option>
            <option>Últimos 7 días</option>
            <option>Últimos 90 días</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Min ROAS: {formatROAS(minRoas)}</label>
          <input
            type="range" min={0} max={10} step={0.5} value={minRoas}
            onChange={(e) => setMinRoas(Number(e.target.value))}
            className="w-full accent-primary mt-2"
          />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiLive label="Total Ventas" value={formatMXN(totalVentas)} sub="MXN (Bruto)" icon={<TrendingUp size={14} />} />
        <KpiLive label="ROAS Promedio" value={formatROAS(avgRoas)} sub="Promedio hist." icon={<Target size={14} />} />
        <KpiLive label="Margen Promedio" value={formatPct(avgMargen * 100)} sub="Optimización sugerida" icon={<BarChart2 size={14} />} />
        <KpiLive label="Total Lives" value={String(filtered.length)} sub="Sesiones activas" icon={<BarChart2 size={14} />} />
        {bestLive && (
          <div className="bg-card rounded-lg border-2 border-primary p-4">
            <span className="text-[9px] uppercase tracking-wider text-primary font-medium">Mejor Live</span>
            <div className="text-2xl font-medium text-foreground mt-1">{formatMXN(bestLive.venta)}</div>
            <p className="text-xs text-muted-foreground">ROAS {formatROAS(bestLive.roas_live)}</p>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Utilidad por live (Cronológico)</h3>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Positivo</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground" /> Negativo</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={{ background: 'hsl(0,0%,10%)', border: '1px solid hsl(0,0%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="utilidad" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.utilidad >= 0 ? 'hsl(14,100%,57%)' : 'hsl(0,0%,30%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Desempeño por Host</h3>
          <div className="space-y-3">
            {hostStats.map((h) => (
              <div key={h.host} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-foreground" style={{ backgroundColor: HOST_COLORS[h.host] + '33' }}>
                  {h.host.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{h.host}</span>
                  <p className="text-[10px] text-muted-foreground">ROAS {formatROAS(h.roas)} · Mejor: {formatMXN(h.mejor)}</p>
                </div>
                <span className={`text-xs font-medium ${h.margen >= 0 ? 'text-status-good' : 'text-status-critical'}`}>
                  Margen {formatPct(h.margen * 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Fecha', 'Hora', 'Host', 'Duración', 'ROAS', 'Venta', 'Ads', 'Mercancía', 'Utilidad', 'Margen %'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const rowBg = l.margen > 0.2 ? 'bg-[rgba(34,197,94,0.06)]' : l.margen >= 0 ? 'bg-[rgba(234,179,8,0.06)]' : 'bg-[rgba(239,68,68,0.06)]';
                const utilColor = l.margen > 0.2 ? 'text-status-good' : l.margen >= 0 ? 'text-status-warning' : 'text-status-critical';
                return (
                  <tr key={l.id} className={`border-b border-border/50 ${rowBg} hover:bg-muted/20`}>
                    <td className="px-4 py-3 text-foreground">{l.fecha}</td>
                    <td className="px-4 py-3 text-foreground">{l.hora}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{l.host || '—'}</td>
                    <td className="px-4 py-3 text-primary">{l.duracion}</td>
                    <td className="px-4 py-3 text-foreground">{formatROAS(l.roas_live)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatMXN(l.venta, true)}</td>
                    <td className="px-4 py-3 text-foreground">{formatMXN(l.ads, true)}</td>
                    <td className="px-4 py-3 text-foreground">{formatMXN(l.mercancias)}</td>
                    <td className={`px-4 py-3 font-medium ${utilColor}`}>{formatMXN(l.utilidad, true)}</td>
                    <td className={`px-4 py-3 font-medium ${utilColor}`}>{formatPct(l.margen * 100)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiLive({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-2xl font-medium text-foreground">{value}</div>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
