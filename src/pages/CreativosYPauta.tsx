import { useState, useMemo } from 'react';
import { useDailyMetrics, useCreativos } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import {
  CreditCard, Target, TrendingUp, MousePointerClick, Play, ImageIcon,
  Zap, Lightbulb, FileText, ExternalLink, ChevronDown, ChevronUp,
  Award, TestTube, Rocket, Pause, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const CHANNELS = ['Todos', 'Meta', 'TikTok Ads'] as const;
type Channel = (typeof CHANNELS)[number];

const CREATIVE_COLORS = ['#f97316', '#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#eab308'];

// Mock campaigns data
const MOCK_CAMPAIGNS = {
  Meta: [
    { id: 1, nombre: 'Prospecting - Lookalike 1%', estado: 'Activa', presupuesto: 850, gasto: 12400, impresiones: 580000, clicks: 14200, ctr: 2.45, conversiones: 312, cpa: 39.7, roas: 4.2 },
    { id: 2, nombre: 'Retargeting - Add to Cart 7d', estado: 'Activa', presupuesto: 600, gasto: 8900, impresiones: 220000, clicks: 8800, ctr: 4.0, conversiones: 245, cpa: 36.3, roas: 5.1 },
    { id: 3, nombre: 'Black Friday - UGC Carousel', estado: 'Activa', presupuesto: 1200, gasto: 18500, impresiones: 890000, clicks: 22300, ctr: 2.51, conversiones: 410, cpa: 45.1, roas: 3.8 },
    { id: 4, nombre: 'Brand Awareness - Video Views', estado: 'Pausada', presupuesto: 400, gasto: 3200, impresiones: 450000, clicks: 5400, ctr: 1.2, conversiones: 45, cpa: 71.1, roas: 1.9 },
    { id: 5, nombre: 'DPA - Catalog Sales', estado: 'Activa', presupuesto: 700, gasto: 9800, impresiones: 340000, clicks: 11200, ctr: 3.29, conversiones: 289, cpa: 33.9, roas: 4.8 },
    { id: 6, nombre: 'Engagement - Reels Promo', estado: 'Activa', presupuesto: 500, gasto: 6100, impresiones: 620000, clicks: 15500, ctr: 2.5, conversiones: 178, cpa: 34.3, roas: 3.5 },
  ],
  'TikTok Ads': [
    { id: 7, nombre: 'Spark Ads - Trending UGC', estado: 'Activa', presupuesto: 900, gasto: 14200, impresiones: 1200000, clicks: 36000, ctr: 3.0, conversiones: 520, cpa: 27.3, roas: 5.6 },
    { id: 8, nombre: 'In-Feed - Demo Product', estado: 'Activa', presupuesto: 650, gasto: 8400, impresiones: 780000, clicks: 19500, ctr: 2.5, conversiones: 310, cpa: 27.1, roas: 4.9 },
    { id: 9, nombre: 'TopView - Launch Campaign', estado: 'Pausada', presupuesto: 2000, gasto: 22000, impresiones: 3500000, clicks: 42000, ctr: 1.2, conversiones: 380, cpa: 57.9, roas: 2.8 },
    { id: 10, nombre: 'Collection Ads - Best Sellers', estado: 'Activa', presupuesto: 800, gasto: 11600, impresiones: 950000, clicks: 28500, ctr: 3.0, conversiones: 445, cpa: 26.1, roas: 5.2 },
    { id: 11, nombre: 'Live Shopping - Redirect', estado: 'Activa', presupuesto: 550, gasto: 7200, impresiones: 680000, clicks: 17000, ctr: 2.5, conversiones: 198, cpa: 36.4, roas: 3.9 },
    { id: 12, nombre: 'Branded Mission - Challenge', estado: 'Activa', presupuesto: 1100, gasto: 15800, impresiones: 2100000, clicks: 52500, ctr: 2.5, conversiones: 390, cpa: 40.5, roas: 3.4 },
  ],
};

const MOCK_CREATIVES = [
  { id: 'CR-042', nombre: 'UGC Testimonial — Antes/Después', channel: 'Meta', tipo: 'video', spend: 4200, roas: 5.8, cpa: 28, ctr: 3.2, status: 'Winner', gradient: 'from-orange-600 to-red-600' },
  { id: 'CR-055', nombre: 'Carousel — 5 Beneficios', channel: 'Meta', tipo: 'image', spend: 3100, roas: 4.9, cpa: 32, ctr: 2.8, status: 'Scale', gradient: 'from-blue-600 to-indigo-600' },
  { id: 'CR-061', nombre: 'Spark Ad — Influencer Reseña', channel: 'TikTok', tipo: 'video', spend: 5600, roas: 6.2, cpa: 24, ctr: 3.8, status: 'Winner', gradient: 'from-pink-600 to-purple-600' },
  { id: 'CR-038', nombre: 'Producto en Uso — POV', channel: 'TikTok', tipo: 'video', spend: 2800, roas: 4.1, cpa: 35, ctr: 2.5, status: 'Testing', gradient: 'from-emerald-600 to-teal-600' },
  { id: 'CR-049', nombre: 'Static — Oferta Flash', channel: 'Meta', tipo: 'image', spend: 1900, roas: 3.5, cpa: 42, ctr: 1.9, status: 'Testing', gradient: 'from-amber-600 to-yellow-600' },
  { id: 'CR-063', nombre: 'Demo Rápido — 15s', channel: 'TikTok', tipo: 'video', spend: 4800, roas: 5.4, cpa: 29, ctr: 3.5, status: 'Scale', gradient: 'from-violet-600 to-fuchsia-600' },
];

const RECOMMENDATIONS = [
  { icon: Rocket, text: 'Crear variación del creativo #CR-042 con hook de testimonio — ROAS potencial 4.8x', priority: 'high' },
  { icon: ArrowUpRight, text: 'Escalar presupuesto de campaña Black Friday UGC +30% — margen CPA de $15 disponible', priority: 'high' },
  { icon: Pause, text: 'Pausar creativo #CR-049 — CPA subió 45% en 7 días, ROAS bajo target', priority: 'medium' },
  { icon: TestTube, text: 'Probar formato carousel en TikTok — conversion rate 2.3x vs video en Meta', priority: 'medium' },
];

const SCRIPTS = [
  {
    title: 'Hook de Problema + Solución',
    hook: '"¿Sabías que el 80% de las personas cometen este error con su piel?"',
    body: '1. Problema relatable → 2. Agitar consecuencias → 3. Revelar producto → 4. Antes/Después',
    cta: '"Link en bio — 20% OFF solo hoy"',
    performance: 'ROAS estimado: 4.5x - 5.2x',
  },
  {
    title: 'UGC Testimonial Storytelling',
    hook: '"No lo puedo creer, miren el cambio en solo 2 semanas"',
    body: '1. Reacción genuina → 2. Rutina paso a paso → 3. Resultados visibles → 4. Comparativa',
    cta: '"Compra ahora con envío gratis"',
    performance: 'ROAS estimado: 5.0x - 6.1x',
  },
  {
    title: 'Trending Sound + Demo Rápido',
    hook: 'Sonido trending + texto: "POV: descubres el producto que necesitabas"',
    body: '1. Unboxing rápido → 2. Aplicación en cámara → 3. Resultado inmediato',
    cta: '"TikTok Shop — compra sin salir"',
    performance: 'ROAS estimado: 3.8x - 4.5x',
  },
];

export default function CreativosYPauta() {
  const { activeBrand } = useAppStore();
  const { data: metrics } = useDailyMetrics();
  const { data: creativos } = useCreativos();
  const [selectedChannel, setSelectedChannel] = useState<Channel>('Todos');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const adMetrics = useMemo(() => {
    if (!metrics?.length) return { spend: 0, revenue: 0, pedidos: 0 };
    const adRows = metrics.filter(m => m.canal === 'Meta' || m.canal === 'TikTok Ads');
    return {
      spend: adRows.reduce((s, m) => s + (m.anuncios || 0), 0),
      revenue: adRows.reduce((s, m) => s + (m.ventas_brutas || 0), 0),
      pedidos: adRows.reduce((s, m) => s + (m.pedidos || 0), 0),
    };
  }, [metrics]);

  const roas = adMetrics.spend > 0 ? adMetrics.revenue / adMetrics.spend : 0;
  const cpa = adMetrics.pedidos > 0 ? adMetrics.spend / adMetrics.pedidos : 0;

  const campaigns = useMemo(() => {
    if (selectedChannel === 'Todos') return [...MOCK_CAMPAIGNS.Meta, ...MOCK_CAMPAIGNS['TikTok Ads']];
    return MOCK_CAMPAIGNS[selectedChannel] || [];
  }, [selectedChannel]);

  const hookData = [
    { name: 'Pregunta', roas: 5.2, lift: '+45%' },
    { name: 'Testimonio', roas: 4.8, lift: '+32%' },
    { name: 'POV', roas: 4.1, lift: '+18%' },
  ];

  const formatData = [
    { name: 'UGC Video', value: 85 },
    { name: 'Carousel', value: 72 },
    { name: 'Video Corto', value: 68 },
    { name: 'Static', value: 45 },
  ];

  const durationData = [
    { name: '0-15s', roas: 4.8 },
    { name: '15-30s', roas: 5.2 },
    { name: '30-60s', roas: 3.9 },
    { name: '60s+', roas: 2.8 },
  ];

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
        <KpiCard label="CTR Promedio" value="2.3%" icon={<MousePointerClick size={16} />} />
      </div>

      {/* SECTION 2 — Channel Tabs + Performance Table */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <span className="text-sm font-medium text-foreground mr-3">Campañas</span>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                {['Campaña', 'Estado', 'Ppto/Día', 'Gasto', 'Impresiones', 'Clicks', 'CTR', 'Conv.', 'CPA', 'ROAS'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setExpandedRow(expandedRow === c.id ? null : c.id)}
                  className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{c.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.estado === 'Activa' ? 'bg-status-good/20 text-status-good' : 'bg-muted text-muted-foreground'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.estado === 'Activa' ? 'bg-status-good' : 'bg-muted-foreground'}`} />
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatMXN(c.presupuesto)}</td>
                  <td className="px-4 py-3 text-foreground">{formatMXN(c.gasto)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{(c.impresiones / 1000).toFixed(0)}K</td>
                  <td className="px-4 py-3 text-muted-foreground">{(c.clicks / 1000).toFixed(1)}K</td>
                  <td className="px-4 py-3 text-foreground">{c.ctr.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-foreground">{c.conversiones}</td>
                  <td className="px-4 py-3 text-foreground">{formatMXN(c.cpa)}</td>
                  <td className={`px-4 py-3 font-medium ${c.roas >= 4 ? 'text-status-good' : c.roas >= 3 ? 'text-status-warning' : 'text-status-critical'}`}>
                    {c.roas.toFixed(1)}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 — Top Creatives Gallery */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Creativos Top</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_CREATIVES.map(cr => (
            <div key={cr.id} className="bg-card rounded-lg border border-border overflow-hidden group">
              {/* Thumbnail placeholder */}
              <div className={`h-36 bg-gradient-to-br ${cr.gradient} flex items-center justify-center relative`}>
                {cr.tipo === 'video' ? (
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Play size={20} className="text-white ml-0.5" />
                  </div>
                ) : (
                  <ImageIcon size={28} className="text-white/60" />
                )}
                <span className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  cr.status === 'Winner' ? 'bg-status-good/20 text-status-good' :
                  cr.status === 'Scale' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {cr.status === 'Winner' && <Award size={10} className="inline mr-1" />}
                  {cr.status === 'Scale' && <Rocket size={10} className="inline mr-1" />}
                  {cr.status === 'Testing' && <TestTube size={10} className="inline mr-1" />}
                  {cr.status}
                </span>
                <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                  {cr.channel}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">{cr.id}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{cr.nombre}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Spend</p>
                    <p className="text-xs font-medium text-foreground">{formatMXN(cr.spend)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">ROAS</p>
                    <p className={`text-xs font-medium ${cr.roas >= 4 ? 'text-status-good' : 'text-status-warning'}`}>{cr.roas}x</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">CPA</p>
                    <p className="text-xs font-medium text-foreground">${cr.cpa}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">CTR</p>
                    <p className="text-xs font-medium text-foreground">{cr.ctr}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 — Creative Analysis + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — Análisis de Creativos */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-5">
          <h3 className="text-sm font-medium text-foreground">Análisis de Creativos</h3>

          {/* Hooks que Funcionan */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Hooks que Funcionan</p>
            <div className="space-y-2">
              {hookData.map(h => (
                <div key={h.name} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Hook de {h.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-status-good">ROAS {h.roas}x</span>
                    <span className="text-[10px] text-primary font-medium">{h.lift} vs promedio</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formatos Top */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Formatos Top</p>
            <div className="space-y-2">
              {formatData.map(f => (
                <div key={f.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground">{f.value}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${f.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mejores Duraciones */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Mejores Duraciones</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={durationData} barSize={24}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}x`, 'ROAS']}
                />
                <Bar dataKey="roas" radius={[4, 4, 0, 0]}>
                  {durationData.map((_, i) => (
                    <Cell key={i} fill={i === 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} />
                  ))}
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
          <div className="space-y-3">
            {RECOMMENDATIONS.map((rec, i) => {
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
        </div>
      </div>

      {/* SECTION 5 — Script Suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-primary" />
          <h2 className="text-sm font-medium text-foreground">Sugerencias de Guiones</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {SCRIPTS.map((s, i) => (
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
