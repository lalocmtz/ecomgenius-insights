import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLives, useSaveScenario, useKPIs } from '@/hooks/useSupabaseData';
import { formatMXN, formatPct } from '@/lib/formatters';
import { Download, Sparkles, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

const scenarios = [
  { label: 'High Efficiency', badge: 'bg-status-good', aov: 200, roas: 4.0 },
  { label: 'Stable Growth', badge: 'bg-status-warning', aov: 300, roas: 2.5 },
  { label: 'Scale Pressure', badge: 'bg-status-critical', aov: 683, roas: 2.0 },
];

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

export default function Finanzas() {
  const { activeBrand } = useAppStore();
  const isFI = activeBrand === 'feel_ink';
  const { data: lives } = useLives();
  const saveScenario = useSaveScenario();
  const { data: kpis, isLoading: kpisLoading } = useKPIs();

  const [aov, setAov] = useState(245);
  const [roas, setRoas] = useState(3.2);
  const [hostCost, setHostCost] = useState(850);

  const sim = calculateMargin(aov, roas, hostCost);

  // P&L from real data
  const totalVentas = (lives || []).reduce((s, l) => s + (l.venta || 0), 0);
  const totalAds = (lives || []).reduce((s, l) => s + (l.ads || 0), 0);
  const totalMercancias = (lives || []).reduce((s, l) => s + (l.mercancias || 0), 0);
  const totalHost = (lives || []).reduce((s, l) => s + (l.costo_host || 0), 0);
  const totalUtilidad = (lives || []).reduce((s, l) => s + (l.utilidad || 0), 0);

  const plRows = [
    { concepto: 'Ventas Brutas', monto: totalVentas, pct: 100 },
    { concepto: 'Mercancía (COGS)', monto: totalMercancias, pct: totalVentas ? (totalMercancias / totalVentas) * 100 : 0 },
    { concepto: 'Publicidad (Ads)', monto: totalAds, pct: totalVentas ? (totalAds / totalVentas) * 100 : 0 },
    { concepto: 'Costo Host', monto: totalHost, pct: totalVentas ? (totalHost / totalVentas) * 100 : 0 },
    { concepto: 'Utilidad Total', monto: totalUtilidad, pct: totalVentas ? (totalUtilidad / totalVentas) * 100 : 0 },
  ];

  const periodKpis = kpis?.filter(k => k.periodo === 'MAR-2025') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
          <h1 className="text-2xl font-medium text-foreground">Finanzas</h1>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary">
            <Download size={14} /> Exportar P&L
          </button>
          <button onClick={() => window.location.href = '/agentes'} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
            <Sparkles size={14} /> Generar Reporte IA
          </button>
        </div>
      </div>

      <Tabs defaultValue="pl">
        <TabsList>
          <TabsTrigger value="pl">P&L y Márgenes</TabsTrigger>
          <TabsTrigger value="kpis">KPIs Financieros</TabsTrigger>
        </TabsList>

        <TabsContent value="pl">
          <div className="space-y-6">
            {/* P&L Summary */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Resumen de P&L — Datos reales</h3>
              <div className="grid grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'Ventas Brutas', value: totalVentas },
                  { label: 'Mercancía', value: totalMercancias },
                  { label: 'Ads', value: totalAds },
                  { label: 'Host', value: totalHost },
                  { label: 'Utilidad', value: totalUtilidad, highlight: true },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
                    <div className={`text-xl font-medium ${item.highlight ? 'text-primary' : 'text-foreground'}`}>{formatMXN(item.value)}</div>
                  </div>
                ))}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Concepto</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Monto</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">% Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {plRows.map((r) => (
                    <tr key={r.concepto} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="py-3 text-foreground">{r.concepto}</td>
                      <td className="py-3 text-right text-foreground">{formatMXN(r.monto, true)}</td>
                      <td className="py-3 text-right text-muted-foreground">{formatPct(r.pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Scenarios + Unit Economics */}
            {isFI && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
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
                  <div className="space-y-2">
                    {[{ label: 'Mercancía', value: '12%' }, { label: 'Guías', value: '6%' }, { label: 'Comisión TTS', value: '8%' }, { label: 'IVA CPA', value: '4%' }, { label: 'Retenciones', value: '9.03%' }, { label: 'Ads (CAC)', value: '25-50%' }].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-primary font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Margin Simulator */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-foreground">Margin Simulator</h3>
                  <p className="text-sm text-muted-foreground mb-6">Ajusta las variables para predecir rentabilidad en TikTok Shop.</p>
                  <div className="space-y-6">
                    <SliderInput label="AOV" value={aov} min={50} max={800} step={5} format={(v) => `$${v}`} onChange={setAov} />
                    <SliderInput label="ROAS" value={roas} min={0.5} max={10} step={0.1} format={(v) => `${v.toFixed(1)}x`} onChange={setRoas} />
                    <SliderInput label="Host Cost" value={hostCost} min={0} max={2000} step={50} format={(v) => `$${v}`} onChange={setHostCost} />
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
                  <button
                    onClick={() => saveScenario.mutate({ nombre: `AOV$${aov} ROAS${roas}x`, aov, roas_objetivo: roas, costo_host: hostCost, margen_estimado: sim.margen / 100, cpa_proyectado: sim.cpaProyectado, profit_unitario: sim.profitUnitario })}
                    className="mt-6 w-full max-w-xs px-4 py-2.5 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-card transition-colors"
                  >
                    Guardar este Escenario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kpis">
          {kpisLoading ? (
            <div className="animate-pulse space-y-4"><div className="h-8 bg-secondary rounded w-48" /><div className="h-64 bg-secondary rounded" /></div>
          ) : periodKpis.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground text-sm">Sin KPIs cargados para el periodo actual.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {periodKpis.map((kpi) => (
                  <div key={kpi.id} className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full text-foreground font-medium ${classColors[kpi.clasificacion || ''] || 'bg-muted'}`}>
                        {kpi.clasificacion}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${statusDot[kpi.status || ''] || 'bg-muted'}`} />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.kpi_name}</span>
                    <div className="text-2xl font-medium text-foreground mt-1">
                      {kpi.unidad === 'MXN' ? formatMXN(kpi.valor_actual || 0) : kpi.unidad === '%' ? formatPct(kpi.valor_actual || 0) : `${kpi.valor_actual}${kpi.unidad}`}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Target: {kpi.unidad === 'MXN' ? formatMXN(kpi.valor_target || 0) : kpi.unidad === '%' ? formatPct(kpi.valor_target || 0) : `${kpi.valor_target}${kpi.unidad}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Deviation Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 bg-card rounded-lg border border-border p-5">
                  <h3 className="text-sm font-medium text-foreground mb-4">Análisis de Desviación</h3>
                  <div className="space-y-4">
                    {periodKpis.filter(k => k.status === 'critico').map(k => (
                      <div key={k.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-status-critical/20 flex items-center justify-center">
                          <AlertTriangle size={14} className="text-status-critical" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground uppercase tracking-wider">{k.kpi_name}</span>
                            <span className="text-xs text-status-critical font-medium">
                              {k.valor_actual && k.valor_target ? `${(k.valor_actual - k.valor_target).toFixed(1)}${k.unidad === '%' ? '%' : ''} vs Target` : ''}
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-status-critical rounded-full" style={{ width: `${Math.min(100, ((k.valor_actual || 0) / (k.valor_target || 1)) * 50)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {periodKpis.filter(k => k.status === 'bien').slice(0, 2).map(k => (
                      <div key={k.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-status-good/20 flex items-center justify-center">
                          <TrendingUp size={14} className="text-status-good" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground uppercase tracking-wider">{k.kpi_name}</span>
                            <span className="text-xs text-status-good font-medium">✓ En meta</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-status-good rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Editorial Pulse</span>
                  <p className="text-sm text-foreground mt-2 leading-relaxed italic">
                    "Conecta el agente IA Financiero para obtener un análisis automatizado de tus KPIs."
                  </p>
                  <button onClick={() => window.location.href = '/agentes'} className="mt-3 w-full px-4 py-2 text-xs font-medium border border-border text-foreground rounded-lg hover:bg-secondary">
                    Sugerir Acciones
                  </button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
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
