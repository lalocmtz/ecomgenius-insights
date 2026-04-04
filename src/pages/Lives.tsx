import { useState, useMemo } from 'react';
import { useLives, useUpdateCell } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import { DollarSign, Target, BarChart3, Radio, Plus, X, ChevronUp, ChevronDown, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const HOSTS = ['DENISSE', 'EMILIO', 'FER', 'KARO'];
const HOST_COLORS: Record<string, string> = {
  DENISSE: '#f97316', EMILIO: '#3b82f6', FER: '#22c55e', KARO: '#eab308',
};

type SortKey = 'fecha' | 'host' | 'venta' | 'roas_live' | 'utilidad' | 'margen';
type SortDir = 'asc' | 'desc';

export default function Lives() {
  const { activeBrand } = useAppStore();
  const { data: livesData, isLoading } = useLives();
  const queryClient = useQueryClient();

  const [hostFilter, setHostFilter] = useState('Todos');
  const [sortKey, setSortKey] = useState<SortKey>('fecha');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showModal, setShowModal] = useState(false);

  // Calculator state
  const [calc, setCalc] = useState({ venta: 0, ads: 0, mercancia: 0, costoHost: 0, pedidos: 0 });

  const filtered = useMemo(() => {
    let rows = (livesData || []).filter((l) => {
      if (hostFilter !== 'Todos' && l.host !== hostFilter) return false;
      return true;
    });
    rows.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [livesData, hostFilter, sortKey, sortDir]);

  const totalVentas = filtered.reduce((s, l) => s + (l.venta || 0), 0);
  const avgRoas = filtered.length ? filtered.reduce((s, l) => s + (l.roas_live || 0), 0) / filtered.length : 0;
  const avgMargen = filtered.length ? filtered.reduce((s, l) => s + (l.margen || 0), 0) / filtered.length : 0;

  // Host stats
  const hostStats = useMemo(() => {
    return HOSTS.map((h) => {
      const hLives = (livesData || []).filter((l) => l.host === h);
      if (!hLives.length) return { host: h, count: 0, revenue: 0, roas: 0, margen: 0 };
      return {
        host: h,
        count: hLives.length,
        revenue: hLives.reduce((s, l) => s + (l.venta || 0), 0),
        roas: hLives.reduce((s, l) => s + (l.roas_live || 0), 0) / hLives.length,
        margen: hLives.reduce((s, l) => s + (l.margen || 0), 0) / hLives.length,
      };
    }).filter(h => h.count > 0);
  }, [livesData]);

  // Calculator computed values
  const calcResults = useMemo(() => {
    const { venta, ads, mercancia, costoHost, pedidos } = calc;
    const comisionTT = venta * 0.08;
    const retenciones = venta * 0.105;
    const ivaAds = ads * 0.16;
    const guias = activeBrand === 'feel_ink' ? pedidos * 126 : pedidos * 100;
    const aov = pedidos > 0 ? venta / pedidos : 0;
    const roas = ads > 0 ? venta / ads : 0;
    const totalCostos = ads + mercancia + costoHost + comisionTT + retenciones + ivaAds + guias;
    const utilidad = venta - totalCostos;
    const margen = venta > 0 ? (utilidad / venta) * 100 : 0;
    return { aov, roas, comisionTT, retenciones, ivaAds, guias, totalCostos, utilidad, margen };
  }, [calc, activeBrand]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-orange-400" /> : <ChevronDown size={12} className="text-orange-400" />;
  };

  if (isLoading) return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-gray-800 rounded w-48" />
      <div className="h-64 bg-gray-800 rounded" />
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Lives Intelligence</p>
          <h1 className="text-2xl font-medium text-white">Análisis de Lives</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Host filter pills */}
          <div className="flex gap-1.5">
            {['Todos', ...HOSTS].map(h => (
              <button
                key={h}
                onClick={() => setHostFilter(h)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  hostFilter === h ? 'bg-orange-500 text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={14} /> Agregar Live
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Ventas" value={formatMXN(totalVentas)} icon={<DollarSign size={14} />} />
        <KpiCard label="ROAS Promedio" value={formatROAS(avgRoas)} icon={<Target size={14} />} />
        <KpiCard label="Margen Promedio" value={formatPct(avgMargen * 100)} icon={<BarChart3 size={14} />} color={avgMargen >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <KpiCard label="Total Lives" value={String(filtered.length)} icon={<Radio size={14} />} />
      </div>

      {/* Middle Row: Host Performance + Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Host Performance */}
        <div className="bg-[#111111] rounded-xl border border-gray-800/60 p-5">
          <h3 className="text-sm font-medium text-white mb-4">Desempeño por Host</h3>
          <div className="space-y-3">
            {hostStats.map((h) => (
              <div key={h.host} className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-colors">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: (HOST_COLORS[h.host] || '#888') + '33', color: HOST_COLORS[h.host] || '#888' }}
                >
                  {h.host.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">{h.host}</span>
                  <p className="text-[10px] text-gray-500">{h.count} lives · {formatMXN(h.revenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">ROAS {formatROAS(h.roas)}</p>
                  <p className={`text-xs font-medium ${h.margen >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPct(h.margen * 100)}
                  </p>
                </div>
              </div>
            ))}
            {hostStats.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Sin datos de hosts</p>}
          </div>
        </div>

        {/* Live Calculator */}
        <div className="bg-[#111111] rounded-xl border border-gray-800/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={14} className="text-orange-400" />
            <h3 className="text-sm font-medium text-white">Calculadora de Live</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <CalcInput label="Venta Total" value={calc.venta} onChange={v => setCalc(c => ({ ...c, venta: v }))} />
            <CalcInput label="Gasto Ads" value={calc.ads} onChange={v => setCalc(c => ({ ...c, ads: v }))} />
            <CalcInput label="Costo Mercancía" value={calc.mercancia} onChange={v => setCalc(c => ({ ...c, mercancia: v }))} />
            <CalcInput label="Costo Host" value={calc.costoHost} onChange={v => setCalc(c => ({ ...c, costoHost: v }))} />
            <CalcInput label="Pedidos" value={calc.pedidos} onChange={v => setCalc(c => ({ ...c, pedidos: v }))} />
          </div>
          <div className="border-t border-gray-800 pt-3 space-y-1.5">
            <CalcRow label="AOV" value={calc.pedidos > 0 ? formatMXN(calcResults.aov) : '—'} />
            <CalcRow label="ROAS" value={calc.ads > 0 ? formatROAS(calcResults.roas) : '—'} />
            <CalcRow label="Comisión TikTok (8%)" value={formatMXN(calcResults.comisionTT)} />
            <CalcRow label="Retenciones (10.5%)" value={formatMXN(calcResults.retenciones)} />
            <CalcRow label="IVA Ads (16%)" value={formatMXN(calcResults.ivaAds)} />
            <CalcRow label={`Guías (${activeBrand === 'feel_ink' ? '$126' : '$100'}/pedido)`} value={formatMXN(calcResults.guias)} />
            <div className="border-t border-gray-700 pt-2 mt-2">
              <CalcRow label="Total Costos" value={formatMXN(calcResults.totalCostos)} bold />
              <CalcRow
                label="Utilidad"
                value={formatMXN(calcResults.utilidad)}
                bold
                color={calcResults.utilidad >= 0 ? 'text-emerald-400' : 'text-red-400'}
              />
              <CalcRow
                label="Margen %"
                value={formatPct(calcResults.margen)}
                bold
                color={calcResults.margen >= 0 ? 'text-emerald-400' : 'text-red-400'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] rounded-xl border border-gray-800/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800/60">
          <h3 className="text-sm font-medium text-white">Detalle de Lives ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60">
                {([
                  ['fecha', 'Fecha'], ['host', 'Host'], ['duracion', 'Duración'],
                  ['pedidos', 'Pedidos'], ['venta', 'Venta'], ['ads', 'Ads'],
                  ['roas_live', 'ROAS'], ['mercancias', 'Mercancía'], ['costo_host', 'Costo Host'],
                  ['utilidad', 'Utilidad'], ['margen', 'Margen %'],
                ] as [string, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key as SortKey)}
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-medium cursor-pointer hover:text-gray-300 select-none"
                  >
                    <span className="flex items-center gap-1">{label} <SortIcon col={key as SortKey} /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const m = l.margen || 0;
                const utilColor = m > 0.2 ? 'text-emerald-400' : m >= 0 ? 'text-yellow-400' : 'text-red-400';
                return (
                  <tr key={l.id} className="border-b border-gray-800/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-gray-300">{l.fecha}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: HOST_COLORS[l.host || ''] || '#666' }}
                        />
                        <span className="text-white font-medium">{l.host || '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{l.duracion || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{l.pedidos ?? 0}</td>
                    <td className="px-4 py-3 text-white font-medium">{formatMXN(l.venta || 0)}</td>
                    <td className="px-4 py-3 text-gray-300">{formatMXN(l.ads || 0)}</td>
                    <td className="px-4 py-3 text-gray-300">{formatROAS(l.roas_live || 0)}</td>
                    <td className="px-4 py-3 text-gray-300">{formatMXN(l.mercancias || 0)}</td>
                    <td className="px-4 py-3 text-gray-300">{formatMXN(l.costo_host || 0)}</td>
                    <td className={`px-4 py-3 font-medium ${utilColor}`}>{formatMXN(l.utilidad || 0)}</td>
                    <td className={`px-4 py-3 font-medium ${utilColor}`}>{formatPct((l.margen || 0) * 100)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Live Modal */}
      {showModal && <AddLiveModal activeBrand={activeBrand} onClose={() => setShowModal(false)} onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['lives'] });
        setShowModal(false);
      }} />}
    </div>
  );
}

/* ── Sub Components ── */

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="bg-[#111111] rounded-xl border border-gray-800/60 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</span>
        <span className="text-gray-600">{icon}</span>
      </div>
      <div className={`text-2xl font-medium ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}

function CalcInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1 block">{label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
        placeholder="0"
      />
    </div>
  );
}

function CalcRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-xs ${bold ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-xs ${bold ? 'font-semibold' : ''} ${color || 'text-gray-300'}`}>{value}</span>
    </div>
  );
}

function AddLiveModal({ activeBrand, onClose, onSaved }: { activeBrand: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    duracion: '',
    host: HOSTS[0],
    pedidos: 0,
    venta: 0,
    ads: 0,
    mercancias: 0,
    costo_host: 0,
  });
  const [saving, setSaving] = useState(false);

  const computed = useMemo(() => {
    const { venta, ads, pedidos, mercancias, costo_host } = form;
    const comision = venta * 0.08;
    const retenciones = venta * 0.105;
    const ivaAds = ads * 0.16;
    const guias = activeBrand === 'feel_ink' ? pedidos * 126 : pedidos * 100;
    const roas = ads > 0 ? venta / ads : 0;
    const aov = pedidos > 0 ? venta / pedidos : 0;
    const gastoTotal = ads + mercancias + costo_host + comision + retenciones + ivaAds + guias;
    const utilidad = venta - gastoTotal;
    const margen = venta > 0 ? utilidad / venta : 0;
    return { roas, aov, utilidad, margen, gastoTotal, comision, retenciones, ivaAds, guias };
  }, [form, activeBrand]);

  const handleSave = async () => {
    if (!form.fecha || form.venta <= 0) {
      toast.error('Fecha y Venta son requeridos');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('lives_analysis').insert({
      brand: activeBrand,
      fecha: form.fecha,
      hora: form.hora || null,
      duracion: form.duracion || null,
      host: form.host,
      pedidos: form.pedidos,
      venta: form.venta,
      ads: form.ads,
      mercancias: form.mercancias,
      costo_host: form.costo_host,
      roas_live: computed.roas,
      aov: computed.aov,
      utilidad: computed.utilidad,
      margen: computed.margen,
      gasto_total: computed.gastoTotal,
      envio_comision_tt: computed.comision,
      iva_ads: computed.ivaAds,
      impuestos: computed.retenciones,
    });
    setSaving(false);
    if (error) { toast.error('Error: ' + error.message); return; }
    toast.success('Live agregado');
    onSaved();
  };

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111111] border border-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Agregar Live</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Fecha" type="date" value={form.fecha} onChange={v => set('fecha', v)} />
          <ModalField label="Hora" type="time" value={form.hora} onChange={v => set('hora', v)} />
          <ModalField label="Duración" type="text" value={form.duracion} onChange={v => set('duracion', v)} placeholder="1:30" />
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1 block">Host</label>
            <select value={form.host} onChange={e => set('host', e.target.value)} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none">
              {HOSTS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <ModalField label="Pedidos" type="number" value={form.pedidos} onChange={v => set('pedidos', Number(v) || 0)} />
          <ModalField label="Venta Total" type="number" value={form.venta} onChange={v => set('venta', Number(v) || 0)} />
          <ModalField label="Gasto Ads" type="number" value={form.ads} onChange={v => set('ads', Number(v) || 0)} />
          <ModalField label="Mercancía" type="number" value={form.mercancias} onChange={v => set('mercancias', Number(v) || 0)} />
          <ModalField label="Costo Host" type="number" value={form.costo_host} onChange={v => set('costo_host', Number(v) || 0)} />
        </div>

        {/* Computed preview */}
        <div className="bg-[#0a0a0a] rounded-lg p-3 space-y-1 border border-gray-800">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Valores Calculados</p>
          <div className="flex justify-between text-xs"><span className="text-gray-500">ROAS</span><span className="text-gray-300">{formatROAS(computed.roas)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Utilidad</span><span className={computed.utilidad >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatMXN(computed.utilidad)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Margen</span><span className={computed.margen >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatPct(computed.margen * 100)}</span></div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Live'}
        </button>
      </div>
    </div>
  );
}

function ModalField({ label, type, value, onChange, placeholder }: { label: string; type: string; value: string | number; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
      />
    </div>
  );
}
