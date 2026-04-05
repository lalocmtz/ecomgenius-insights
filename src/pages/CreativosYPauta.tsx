import { useState, useMemo } from 'react';
import { useDailyMetrics, useCreativos } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import {
  CreditCard, Target, TrendingUp, MousePointerClick, Play, ImageIcon,
  Zap, Lightbulb, FileText, ExternalLink,
  Award, TestTube, Rocket, Pause, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const CHANNELS = ['Todos', 'Meta', 'TikTok Ads'] as const;
type Channel = (typeof CHANNELS)[number];

const CREATIVE_GRADIENTS: Record<string, string> = {
  meta: 'from-blue-600 to-indigo-600',
  tiktok_ads: 'from-pink-600 to-purple-600',
  tiktok: 'from-pink-600 to-purple-600',
};

const STATUS_MAP: Record<string, { label: string; icon: typeof Award; className: string }> = {
  activo: { label: 'Activo', icon: Rocket, className: 'bg-primary/20 text-primary' },
  winner: { label: 'Winner', icon: Award, className: 'bg-status-good/20 text-status-good' },
  testing: { label: 'Testing', icon: TestTube, className: 'bg-muted text-muted-foreground' },
  pausado: { label: 'Pausado', icon: Pause, className: 'bg-muted text-muted-foreground' },
};

export default function CreativosYPauta() {
  const { activeBrand } = useAppStore();
  const { data: metrics, isLoading: metricsLoading } = useDailyMetrics();
  const { data: creativos, isLoading: creativosLoading } = useCreativos();
  const [selectedChannel, setSelectedChannel] = useState<Channel>('Todos');

  const isLoading = metricsLoading || creativosLoading;

  // KPIs from real daily_metrics (Meta + TikTok Ads channels)
  const adMetrics = useMemo(() => {
    if (!metrics?.length) return { spend: 0, revenue: 0, pedidos: 0, clicks: 0, impressions: 0 };
    const adRows = metrics.filter(m => {
      if (selectedChannel === 'Todos') return m.canal === 'Meta' || m.canal === 'TikTok Ads';
      return m.canal === selectedChannel;
    });
    return {
      spend: adRows.reduce((s, m) => s + (m.anuncios || 0), 0),
      revenue: adRows.reduce((s, m) => s + (m.ventas_brutas || 0), 0),
      pedidos: adRows.reduce((s, m) => s + (m.pedidos || 0), 0),
      clicks: 0,
      impressions: 0,
    };
  }, [metrics, selectedChannel]);

  const roas = adMetrics.spend > 0 ? adMetrics.revenue / adMetrics.spend : 0;
  const cpa = adMetrics.pedidos > 0 ? adMetrics.spend / adMetrics.pedidos : 0;

  // Channel breakdown from daily_metrics
  const channelBreakdown = useMemo(() => {
    if (!metrics?.length) return [];
    const adRows = metrics.filter(m => m.canal === 'Meta' || m.canal === 'TikTok Ads');
    const map: Record<string, { canal: string; spend: number; revenue: number; pedidos: number }> = {};
    adRows.forEach(m => {
      if (!map[m.canal]) map[m.canal] = { canal: m.canal, spend: 0, revenue: 0, pedidos: 0 };
      map[m.canal].spend += m.anuncios || 0;
      map[m.canal].revenue += m.ventas_brutas || 0;
      map[m.canal].pedidos += m.pedidos || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [metrics]);

  // Filtered creativos
  const filteredCreativos = useMemo(() => {
    if (!creativos?.length) return [];
    if (selectedChannel === 'Todos') return creativos;
    const platMap: Record<string, string> = { 'Meta': 'meta', 'TikTok Ads': 'tiktok_ads' };
    return creativos.filter(c => c.plataforma === platMap[selectedChannel]);
  }, [creativos, selectedChannel]);

  // Creative analysis derived from real creativos data
  const creativeAnalysis = useMemo(() => {
    if (!creativos?.length) return { hookData: [], formatData: [], durationData: [] };

    // Group by angulo (hook type)
    const anguloMap: Record<string, { count: number; totalRoas: number }> = {};
    creativos.forEach(c => {
      const key = c.angulo || 'sin_angulo';
      if (!anguloMap[key]) anguloMap[key] = { count: 0, totalRoas: 0 };
      anguloMap[key].count++;
      anguloMap[key].totalRoas += Number(c.roas) || 0;
    });
    const avgRoas = creativos.reduce((s, c) => s + (Number(c.roas) || 0), 0) / creativos.length;
    const hookData = Object.entries(anguloMap)
      .map(([name, d]) => {
        const r = d.count > 0 ? d.totalRoas / d.count : 0;
        const lift = avgRoas > 0 ? ((r - avgRoas) / avgRoas * 100) : 0;
        return { name, roas: r, lift: `${lift >= 0 ? '+' : ''}${lift.toFixed(0)}%` };
      })
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 4);

    // Group by tipo (format)
    const tipoMap: Record<string, { count: number; totalRoas: number }> = {};
    creativos.forEach(c => {
      const key = c.tipo || 'otro';
      if (!tipoMap[key]) tipoMap[key] = { count: 0, totalRoas: 0 };
      tipoMap[key].count++;
      tipoMap[key].totalRoas += Number(c.roas) || 0;
    });
    const maxCount = Math.max(...Object.values(tipoMap).map(d => d.count), 1);
    const formatData = Object.entries(tipoMap)
      .map(([name, d]) => ({ name, value: Math.round((d.count / maxCount) * 100) }))
      .sort((a, b) => b.value - a.value);

    // Duration buckets
    const durBuckets = [
      { name: '0-15s', min: 0, max: 15, totalRoas: 0, count: 0 },
      { name: '15-30s', min: 15, max: 30, totalRoas: 0, count: 0 },
      { name: '30-60s', min: 30, max: 60, totalRoas: 0, count: 0 },
      { name: '60s+', min: 60, max: 9999, totalRoas: 0, count: 0 },
    ];
    creativos.forEach(c => {
      const dur = c.duracion_seg || 20;
      const bucket = durBuckets.find(b => dur >= b.min && dur < b.max);
      if (bucket) { bucket.count++; bucket.totalRoas += Number(c.roas) || 0; }
    });
    const durationData = durBuckets.map(b => ({ name: b.name, roas: b.count > 0 ? b.totalRoas / b.count : 0 }));

    return { hookData, formatData, durationData };
  }, [creativos]);

  // AI Recommendations derived from real data
  const recommendations = useMemo(() => {
    if (!creativos?.length) return [];
    const recs: { icon: typeof Rocket; text: string; priority: string }[] = [];
    const sorted = [...creativos].sort((a, b) => (Number(b.roas) || 0) - (Number(a.roas) || 0));
    const topCreative = sorted[0];
    if (topCreative) {
      recs.push({
        icon: Rocket,
        text: `Escalar "${topCreative.nombre}" — ROAS ${Number(topCreative.roas).toFixed(1)}x, crear variaciones con diferentes hooks`,
        priority: 'high',
      });
    }
    const lowPerformers = sorted.filter(c => (Number(c.roas) || 0) < 2 && c.estado === 'activo');
    if (lowPerformers.length > 0) {
      recs.push({
        icon: Pause,
        text: `Pausar ${lowPerformers.length} creativo(s) con ROAS < 2x para optimizar presupuesto`,
        priority: 'medium',
      });
    }
    if (roas > 0) {
      recs.push({
        icon: ArrowUpRight,
        text: `ROAS blended actual: ${roas.toFixed(1)}x. ${roas >= 3.5 ? 'Margen para escalar presupuesto +20%' : 'Optimizar antes de escalar — target mínimo 3.5x'}`,
        priority: roas >= 3.5 ? 'high' : 'medium',
      });
    }
    recs.push({
      icon: TestTube,
      text: 'Probar formato UGC testimonial en la plataforma con menor ROAS para igualar performance',
      priority: 'medium',
    });
    return recs;
  }, [creativos, roas]);

  // Script suggestions derived from top hooks
  const scripts = useMemo(() => {
    const topHook = creativeAnalysis.hookData[0];
    return [
      {
        title: 'Hook de Problema + Solución',
        hook: '"¿Sabías que el 80% de las personas cometen este error?"',
        body: '1. Problema relatable → 2. Agitar consecuencias → 3. Revelar producto → 4. Antes/Después',
        cta: '"Link en bio — descuento exclusivo"',
        performance: `ROAS estimado: ${topHook ? (topHook.roas * 0.9).toFixed(1) : '4.0'}x - ${topHook ? (topHook.roas * 1.1).toFixed(1) : '5.0'}x`,
      },
      {
        title: 'UGC Testimonial Storytelling',
        hook: '"No lo puedo creer, miren el cambio en solo 2 semanas"',
        body: '1. Reacción genuina → 2. Rutina paso a paso → 3. Resultados visibles → 4. Comparativa',
        cta: '"Compra ahora con envío gratis"',
        performance: `ROAS estimado: ${topHook ? (topHook.roas * 1.0).toFixed(1) : '5.0'}x - ${topHook ? (topHook.roas * 1.2).toFixed(1) : '6.0'}x`,
      },
      {
        title: 'Trending Sound + Demo Rápido',
        hook: 'Sonido trending + texto: "POV: descubres el producto que necesitabas"',
        body: '1. Unboxing rápido → 2. Aplicación en cámara → 3. Resultado inmediato',
        cta: '"TikTok Shop — compra sin salir"',
        performance: `ROAS estimado: ${topHook ? (topHook.roas * 0.8).toFixed(1) : '3.5'}x - ${topHook ? (topHook.roas * 0.95).toFixed(1) : '4.5'}x`,
      },
    ];
  }, [creativeAnalysis.hookData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground animate-pulse">Cargando datos...</div>
      </div>
    );
  }

  const noData = !metrics?.length && !creativos?.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Creative Command Center</p>
        <h1 className="text-2xl font-medium text-foreground">Creativos & Pauta</h1>
      </div>

      {/* SECTION 1 — KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ad Spend Total" value={formatMXN(adMetrics.spend)} icon={<CreditCard size={16} />} />
        <KpiCard label="ROAS Blended" value={formatROAS(roas)} icon={<Target size={16} />} status={roas >= 3.5 ? 'good' : roas >= 2 ? 'warning' : 'critical'} />
        <KpiCard label="CPA Promedio" value={formatMXN(cpa)} icon={<TrendingUp size={16} />} />
        <KpiCard label="CTR Promedio" value={adMetrics.spend > 0 ? '—' : '—'} icon={<MousePointerClick size={16} />} />
      </div>

      {/* SECTION 2 — Channel Tabs + Ad Spend Breakdown */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <span className="text-sm font-medium text-foreground mr-3">Rendimiento por Canal</span>
          {CHANNELS.map(ch => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                selectedChannel === ch
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
        {channelBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  {['Canal', 'Revenue', 'Ad Spend', 'ROAS', 'Pedidos', 'CPA'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedChannel === 'Todos' ? channelBreakdown : channelBreakdown.filter(c => c.canal === selectedChannel)).map(c => {
                  const r = c.spend > 0 ? c.revenue / c.spend : 0;
                  const cp = c.pedidos > 0 ? c.spend / c.pedidos : 0;
                  return (
                    <tr key={c.canal} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{c.canal}</td>
                      <td className="px-4 py-3 text-foreground">{formatMXN(c.revenue)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatMXN(c.spend)}</td>
                      <td className={`px-4 py-3 font-medium ${r >= 3.5 ? 'text-status-good' : r >= 2 ? 'text-status-warning' : 'text-status-critical'}`}>
                        {formatROAS(r)}
                      </td>
                      <td className="px-4 py-3 text-foreground">{c.pedidos}</td>
                      <td className="px-4 py-3 text-foreground">{formatMXN(cp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos para el periodo seleccionado</p>
        )}
      </div>

      {/* SECTION 3 — Top Creatives Gallery (from creativos table) */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Creativos Top</h2>
        {filteredCreativos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCreativos.slice(0, 6).map(cr => {
              const gradient = CREATIVE_GRADIENTS[cr.plataforma || ''] || 'from-orange-600 to-red-600';
              const st = STATUS_MAP[cr.estado || 'activo'] || STATUS_MAP.activo;
              const Icon = st.icon;
              return (
                <div key={cr.id} className="bg-card rounded-lg border border-border overflow-hidden group">
                  <div className={`h-36 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
                    {cr.tipo === 'video' || cr.tipo === 'ugc' ? (
                      <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Play size={20} className="text-white ml-0.5" />
                      </div>
                    ) : (
                      <ImageIcon size={28} className="text-white/60" />
                    )}
                    <span className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${st.className}`}>
                      <Icon size={10} className="inline mr-1" />
                      {st.label}
                    </span>
                    <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                      {cr.plataforma || '—'}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-foreground mb-1 line-clamp-1">{cr.nombre}</p>
                    {cr.hook_text && <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1 italic">"{cr.hook_text}"</p>}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Spend</p>
                        <p className="text-xs font-medium text-foreground">{formatMXN(Number(cr.spend) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">ROAS</p>
                        <p className={`text-xs font-medium ${(Number(cr.roas) || 0) >= 4 ? 'text-status-good' : 'text-status-warning'}`}>
                          {(Number(cr.roas) || 0).toFixed(1)}x
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">CPA</p>
                        <p className="text-xs font-medium text-foreground">{formatMXN(Number(cr.cpa) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">CTR</p>
                        <p className="text-xs font-medium text-foreground">{(Number(cr.ctr) || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground bg-card rounded-lg border border-border p-8 text-center">Sin creativos para el periodo seleccionado</p>
        )}
      </div>

      {/* SECTION 4 — Creative Analysis + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — Análisis de Creativos */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-5">
          <h3 className="text-sm font-medium text-foreground">Análisis de Creativos</h3>

          {/* Hooks que Funcionan */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Hooks que Funcionan</p>
            {creativeAnalysis.hookData.length > 0 ? (
              <div className="space-y-2">
                {creativeAnalysis.hookData.map(h => (
                  <div key={h.name} className="flex items-center justify-between">
                    <span className="text-xs text-foreground capitalize">{h.name.replace('_', ' ')}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-status-good">ROAS {h.roas.toFixed(1)}x</span>
                      <span className="text-[10px] text-primary font-medium">{h.lift} vs promedio</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin datos</p>
            )}
          </div>

          {/* Formatos Top */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Formatos Top</p>
            {creativeAnalysis.formatData.length > 0 ? (
              <div className="space-y-2">
                {creativeAnalysis.formatData.map(f => (
                  <div key={f.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground capitalize">{f.name}</span>
                      <span className="text-[10px] text-muted-foreground">{f.value}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${f.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin datos</p>
            )}
          </div>

          {/* Mejores Duraciones */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Mejores Duraciones</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={creativeAnalysis.durationData} barSize={24}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v.toFixed(1)}x`, 'ROAS']}
                />
                <Bar dataKey="roas" radius={[4, 4, 0, 0]}>
                  {creativeAnalysis.durationData.map((d, i) => {
                    const maxR = Math.max(...creativeAnalysis.durationData.map(x => x.roas));
                    return <Cell key={i} fill={d.roas === maxR ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT — Recomendaciones IA */}
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-primary" />
            <h3 className="text-sm font-medium text-foreground">Recomendaciones IA</h3>
          </div>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      rec.priority === 'high' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{rec.text}</p>
                      <button className="mt-2 text-[10px] font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                        <ExternalLink size={10} />
                        Delegar en Notion
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4">Sin datos suficientes para generar recomendaciones</p>
          )}
        </div>
      </div>

      {/* SECTION 5 — Script Suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-primary" />
          <h2 className="text-sm font-medium text-foreground">Sugerencias de Guiones</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scripts.map((s, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-foreground">{s.title}</h4>
                <span className="text-[10px] font-medium text-status-good px-2 py-0.5 rounded-full bg-status-good/10">{s.performance}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Hook</p>
                  <p className="text-xs text-foreground italic">{s.hook}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Estructura</p>
                  <p className="text-xs text-muted-foreground">{s.body}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">CTA</p>
                  <p className="text-xs text-foreground italic">{s.cta}</p>
                </div>
              </div>
              <button className="w-full text-xs font-medium text-primary hover:text-primary/80 py-2 border border-border rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                <ExternalLink size={12} />
                Crear en Notion
              </button>
            </div>
          ))}
        </div>
      </div>

      {noData && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Sin datos para el periodo seleccionado
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, status }: { label: string; value: string; icon: React.ReactNode; status?: string }) {
  const color = status === 'good' ? 'text-status-good' : status === 'warning' ? 'text-status-warning' : status === 'critical' ? 'text-status-critical' : 'text-foreground';
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
