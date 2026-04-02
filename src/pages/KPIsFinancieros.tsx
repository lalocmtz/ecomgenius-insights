import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { kpisFeelInk, kpisSkinglow } from '@/data/mockData';
import { formatMXN, formatPct } from '@/lib/formatters';
import { Calendar, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';

const classColors: Record<string, string> = {
  'Rentabilidad': 'bg-status-info',
  'Costos': 'bg-primary',
  'Control': 'bg-status-good',
  'Publicidad': 'bg-[hsl(270,60%,55%)]',
  'Análisis': 'bg-muted-foreground',
};

const statusDot: Record<string, string> = {
  'bien': 'bg-status-good',
  'alerta': 'bg-status-warning',
  'critico': 'bg-status-critical',
};

export default function KPIsFinancieros() {
  const { activeBrand } = useAppStore();
  const [tab, setTab] = useState<'feel_ink' | 'skinglow'>(activeBrand);
  const kpis = tab === 'feel_ink' ? kpisFeelInk : kpisSkinglow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Finanzas Consolidadas</p>
          <h1 className="text-2xl font-medium text-foreground">KPIs Financieros</h1>
          <p className="text-xs text-muted-foreground">Panel de Rendimiento Editorial · {tab === 'feel_ink' ? 'Feel Ink' : 'Skinglow'}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Periodo Actual:</span>
          <span className="font-medium">Octubre 2023</span>
          <Calendar size={16} className="text-muted-foreground" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-full p-0.5 w-fit">
        {(['feel_ink', 'skinglow'] as const).map((b) => (
          <button
            key={b}
            onClick={() => setTab(b)}
            className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${tab === b ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            {b === 'feel_ink' ? 'Feel Ink' : 'Skinglow'}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-medium text-foreground">Análisis Operativo {tab === 'feel_ink' ? 'Feel Ink' : 'Skinglow'}</h2>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.slug} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full text-foreground font-medium ${classColors[kpi.clasificacion] || 'bg-muted'}`}>
                {kpi.clasificacion}
              </span>
              <span className={`w-2 h-2 rounded-full ${statusDot[kpi.status]}`} />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.name}</span>
            <div className="text-2xl font-medium text-foreground mt-1">
              {kpi.unidad === 'MXN' ? formatMXN(kpi.valor) : kpi.unidad === '%' ? formatPct(kpi.valor) : kpi.valor}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                Target: {kpi.unidad === 'MXN' ? formatMXN(kpi.target) : kpi.unidad === '%' ? formatPct(kpi.target) : kpi.target}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Deviation Analysis + Editorial Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Análisis de Desviación</h3>
            <button className="text-[10px] uppercase tracking-wider text-primary font-medium">Ver Histórico</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-status-critical/20 flex items-center justify-center">
                <AlertTriangle size={14} className="text-status-critical" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground uppercase tracking-wider">Gastos de Envío Críticos</span>
                  <span className="text-xs text-status-critical font-medium">+4.4% vs Target</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-status-critical rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-status-good/20 flex items-center justify-center">
                <TrendingUp size={14} className="text-status-good" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground uppercase tracking-wider">Ventas en Expansión</span>
                  <span className="text-xs text-status-good font-medium">+13.2% vs Target</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-status-good rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Editorial Pulse</span>
          <p className="text-sm text-foreground mt-2 leading-relaxed italic">
            "El aumento en ventas compensa la ineficiencia logística de este mes, manteniendo la rentabilidad saludable."
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-7 h-7 rounded-full bg-primary" />
            <div>
              <span className="text-xs font-medium text-foreground">Agente IA Financiero</span>
              <p className="text-[9px] uppercase tracking-wider text-status-good">Ready for Breakdown</p>
            </div>
          </div>
          <button className="mt-3 w-full px-4 py-2 text-xs font-medium border border-border text-foreground rounded-lg hover:bg-secondary">
            Sugerir Acciones
          </button>
        </div>
      </div>
    </div>
  );
}
