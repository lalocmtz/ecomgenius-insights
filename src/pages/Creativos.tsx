import { useState } from 'react';
import { useCreativos, useUpdateCell } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN, formatROAS } from '@/lib/formatters';
import { Plus, Filter, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Creativos() {
  const { activeBrand } = useAppStore();
  const { data: creativos, isLoading } = useCreativos();
  const [filterPlat, setFilterPlat] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ nombre: '', tipo: 'video', plataforma: 'meta', hook_text: '', angulo: '', spend: 0, roas: 0 });

  const filtered = (creativos || []).filter(c => {
    if (filterPlat !== 'all' && c.plataforma !== filterPlat) return false;
    if (filterTipo !== 'all' && c.tipo !== filterTipo) return false;
    return true;
  });

  // Ángulos top
  const anguloStats: Record<string, { count: number; totalRoas: number }> = {};
  (creativos || []).forEach(c => {
    if (!c.angulo) return;
    if (!anguloStats[c.angulo]) anguloStats[c.angulo] = { count: 0, totalRoas: 0 };
    anguloStats[c.angulo].count++;
    anguloStats[c.angulo].totalRoas += (c.roas || 0);
  });
  const topAngulos = Object.entries(anguloStats).sort((a, b) => (b[1].totalRoas / b[1].count) - (a[1].totalRoas / a[1].count)).slice(0, 5);

  const createCreativo = async () => {
    const { error } = await supabase.from('creativos').insert({ brand: activeBrand, ...newForm });
    if (error) toast.error(error.message); else { toast.success('Creativo agregado'); setShowNew(false); }
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary rounded" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
          <h1 className="text-2xl font-medium text-foreground">Creativos</h1>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
          <Plus size={14} /> Nuevo Creativo
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterPlat} onChange={e => setFilterPlat(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="all">Todas las plataformas</option>
          <option value="meta">Meta</option>
          <option value="tiktok_ads">TikTok Ads</option>
          <option value="tiktok_organico">TikTok Org.</option>
          <option value="instagram">Instagram</option>
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="all">Todos los tipos</option>
          <option value="video">Video</option>
          <option value="ugc">UGC</option>
          <option value="imagen">Imagen</option>
          <option value="live_clip">Live Clip</option>
        </select>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const borderColor = (c.roas || 0) > 5 ? 'border-status-good' : (c.roas || 0) > 3 ? 'border-status-warning' : 'border-status-critical';
          return (
            <div key={c.id} className={`bg-card rounded-lg border-2 ${borderColor} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{c.nombre}</span>
                <span className="text-[9px] uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{c.plataforma}</span>
              </div>
              {c.hook_text && <p className="text-xs text-muted-foreground italic mb-2">"{c.hook_text}"</p>}
              <div className="flex items-center gap-4 text-xs">
                <span className="text-primary font-medium">ROAS {formatROAS(c.roas || 0)}</span>
                <span className="text-muted-foreground">CPA {formatMXN(c.cpa || 0)}</span>
                <span className="text-muted-foreground">Spend {formatMXN(c.spend || 0)}</span>
              </div>
              {c.angulo && <span className="inline-block mt-2 text-[9px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.angulo}</span>}
            </div>
          );
        })}
      </div>

      {/* Creative Intelligence */}
      {topAngulos.length > 0 && (
        <div className="bg-card rounded-lg border border-primary/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-medium text-foreground">Creative Intelligence</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {topAngulos.map(([angulo, stats]) => (
              <div key={angulo} className="bg-secondary rounded-lg p-3 text-center">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{angulo}</span>
                <div className="text-lg font-medium text-primary">{formatROAS(stats.totalRoas / stats.count)}</div>
                <span className="text-[10px] text-muted-foreground">{stats.count} creativos</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Creative Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-foreground mb-4">Nuevo Creativo</h3>
            <div className="space-y-3">
              <input value={newForm.nombre} onChange={e => setNewForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              <input value={newForm.hook_text} onChange={e => setNewForm(p => ({ ...p, hook_text: e.target.value }))} placeholder="Hook text" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              <input value={newForm.angulo} onChange={e => setNewForm(p => ({ ...p, angulo: e.target.value }))} placeholder="Ángulo" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              <div className="flex gap-2">
                <select value={newForm.tipo} onChange={e => setNewForm(p => ({ ...p, tipo: e.target.value }))} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="video">Video</option><option value="ugc">UGC</option><option value="imagen">Imagen</option><option value="live_clip">Live Clip</option>
                </select>
                <select value={newForm.plataforma} onChange={e => setNewForm(p => ({ ...p, plataforma: e.target.value }))} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="meta">Meta</option><option value="tiktok_ads">TikTok Ads</option><option value="tiktok_organico">TikTok Org.</option><option value="instagram">Instagram</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowNew(false)} className="flex-1 px-4 py-2 text-sm border border-border rounded-lg text-foreground">Cancelar</button>
              <button onClick={createCreativo} className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
