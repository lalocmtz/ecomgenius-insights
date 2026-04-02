import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN, formatPct } from '@/lib/formatters';
import { Download, Sparkles } from 'lucide-react';

interface SimResult { margen: number; cpaProyectado: number; profitUnitario: number; }

function calculateMargin(aov: number, roas: number, hostCost: number): SimResult {
  const cogs = aov * 0.12;
  const guias = aov * 0.06;
  const comisionTTS = aov * 0.08;
  const cpa = aov / roas;
  const ivaAds = cpa * 0.04;
  const retenciones = aov * 0.0903;
  const costoFijoPerOrder = hostCost / 15;
  const totalCosts = cogs + guias + comisionTTS + cpa + ivaAds + retenciones + costoFijoPerOrder;
  const utilidad = aov - totalCosts;
  const margen = utilidad / aov;
  return {
    margen: Math.round(margen * 1000) / 10,
    cpaProyectado: Math.round(cpa * 100) / 100,
    profitUnitario: Math.round(utilidad * 100) / 100,
  };
}

const plRows = [
  { concepto: 'Ingresos Netos (Post-Devoluciones)', monto: 1116000, pct: 90 },
  { concepto: 'Margen Bruto', monto: 967200, pct: 78 },
  { concepto: 'Publicidad Meta', monto: 185000, pct: 15 },
  { concepto: 'Publicidad TikTok', monto: 225000, pct: 18 },
  { concepto: 'Otros gastos (SaaS, OpEx)', monto: 45000, pct: 3.6 },
];

const scenarios = [
  { label: 'High Efficiency', badge: 'bg-status-good', aov: 200, roas: 4.0 },
  { label: 'Stable Growth', badge: 'bg-status-warning', aov: 300, roas: 2.5 },
  { label: 'Scale Pressure', badge: 'bg-status-critical', aov: 683, roas: 2.0 },
];

export default function Finanzas() {
  const { activeBrand } = useAppStore();
  const isFI = activeBrand === 'feel_ink';

  const [aov, setAov] = useState(245);
  const [roas, setRoas] = useState(3.2);
  const [hostCost, setHostCost] = useState(850);

  const sim = calculateMargin(aov, roas, hostCost);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite / Reporte Q4</p>
          <h1 className="text-2xl font-medium text-foreground">Finanzas</h1>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary">
            <Download size={14} /> Exportar P&L
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
            <Sparkles size={14} /> Generar Reporte IA
          </button>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Resumen de P&L</h3>
          <span className="text-[9px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Real-Time Update</span>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Ingresos Brutos', value: 1240000 },
            { label: 'Costo Producto', value: 148800 },
            { label: 'Marketing Total', value: 410000 },
            { label: 'Logística', value: 74400 },
            { label: 'EBITDA', value: 214560, highlight: true },
          ].map((item) => (
            <div key={item.label}>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
              <div className={`text-xl font-medium ${item.highlight ? 'text-primary' : 'text-foreground'}`}>{formatMXN(item.value)}</div>
            </div>
          ))}
        </div>

        {/* P&L Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Concepto</th>
              <th className="text-right py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Monto</th>
              <th className="text-right py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">% Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {plRows.map((r) => (
              <tr key={r.concepto} className="border-b border-border/50 hover:bg-muted/10">
                <td className="py-3 text-foreground">{r.concepto}</td>
                <td className="py-3 text-right text-foreground">{formatMXN(r.monto)}</td>
                <td className="py-3 text-right text-muted-foreground">{formatPct(r.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TikTok Unit Economics sidebar */}
      {isFI && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {/* Scenarios */}
            <h3 className="text-lg font-medium text-foreground mb-4">Escenarios de Margen Real</h3>
            <div className="grid grid-cols-3 gap-4">
              {scenarios.map((sc) => {
                const res = calculateMargin(sc.aov, sc.roas, 800);
                return (
                  <div key={sc.label} className="bg-card rounded-lg border border-border p-4">
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full text-foreground font-medium ${sc.badge}`}>{sc.label}</span>
                    <p className="text-xs text-muted-foreground mt-2">AOV ${sc.aov} · ROAS {sc.roas}</p>
                    <div className="text-3xl font-medium text-foreground mt-1">{formatPct(res.margen)}</div>
                    <p className="text-xs text-muted-foreground">Margen neto operativo</p>
                    <div className="h-1 bg-secondary rounded-full mt-3 overflow-hidden">
                      <div className={`h-full rounded-full ${sc.badge}`} style={{ width: `${Math.max(5, res.margen)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-2">TikTok Unit Economics</h3>
            <p className="text-xs text-muted-foreground mb-4">Breakdown for TikTok Shop orders with AOV between $200–$300.</p>
            <div className="space-y-2">
              {[
                { label: 'Mercancía', value: '12%' },
                { label: 'Guías de envío', value: '6%' },
                { label: 'Comisión TikTok Shop', value: '8%' },
                { label: 'IVA sobre CPA', value: '4%' },
                { label: 'Retenciones Imp.', value: '9.03%' },
                { label: 'Ads Inversión (CAC)', value: '25-50%' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-primary font-medium">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-secondary rounded-lg text-center">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Fixed Host Cost</span>
              <div className="text-lg font-medium text-foreground">$500 — $1,600<span className="text-xs text-muted-foreground"> / session</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Margin Simulator */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-6">
            <h3 className="text-lg font-medium text-foreground">Margin Simulator</h3>
            <p className="text-sm text-muted-foreground mb-6">Ajusta las variables de pauta y operación para predecir tu rentabilidad final en TikTok Shop.</p>
            <div className="space-y-6">
              <SliderInput label="Average Order Value (AOV)" value={aov} min={50} max={800} step={5} format={(v) => `$${v}`} onChange={setAov} />
              <SliderInput label="ROAS de Campaña" value={roas} min={0.5} max={10} step={0.1} format={(v) => `${v.toFixed(1)}x`} onChange={setRoas} />
              <SliderInput label="Host Cost (Per Session)" value={hostCost} min={0} max={2000} step={50} format={(v) => `$${v}`} onChange={setHostCost} />
            </div>
          </div>
          <div className="bg-secondary p-6 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-2">Simulación de Resultados</span>
            <div className="text-5xl font-medium text-primary">{formatPct(sim.margen)}</div>
            <p className="text-sm text-muted-foreground mt-1">Margen Neto Estimado</p>
            <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-xs">
              <div className="bg-card rounded-lg p-3 text-center">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">CPA Proyectado</span>
                <div className="text-lg font-medium text-foreground">{formatMXN(sim.cpaProyectado, true)}</div>
              </div>
              <div className="bg-card rounded-lg p-3 text-center">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Profit Unitario</span>
                <div className="text-lg font-medium text-foreground">{formatMXN(sim.profitUnitario, true)}</div>
              </div>
            </div>
            <button className="mt-6 w-full max-w-xs px-4 py-2.5 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-card transition-colors">
              Guardar este Escenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderInput({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className="text-sm font-medium text-foreground">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}
