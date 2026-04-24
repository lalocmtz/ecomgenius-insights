import { useState, useMemo, Fragment } from 'react';
import { useLives, useUpdateCell, useHosts, useAddHost, useAllOfferTests, useAddOfferTest, useDeleteOfferTest } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN, formatROAS, formatPct } from '@/lib/formatters';
import { DollarSign, Target, BarChart3, Radio, Plus, X, ChevronUp, ChevronDown, Calculator, TrendingUp, Lightbulb, PieChart, FlaskConical, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const DEFAULT_HOST_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#a855f7', '#06b6d4', '#ef4444'];

type SortKey = 'fecha' | 'host' | 'venta' | 'roas_live' | 'utilidad' | 'margen';
type SortDir = 'asc' | 'desc';

// Brand-specific cost formulas
// productosVendidos × costoUnitario tiene prioridad sobre el porcentaje fijo.
// Si ambos son > 0 → costo preciso por unidad. Si están en 0 → fallback al % histórico.
function computeLiveCosts(
  brand: string,
  venta: number,
  ads: number,
  costoHost: number,
  pedidos: number,
  productosVendidos: number = 0,
  costoUnitario: number = 0,
) {
  const isFI = brand === 'feel_ink';
  const usePreciseCost = productosVendidos > 0 && costoUnitario > 0;
  const producto = usePreciseCost
    ? productosVendidos * costoUnitario
    : venta * (isFI ? 0.12 : 0.2498);
  const guias = venta * 0.06;
  const ivaAds = ads * 0.16;
  const comisionTT = venta * 0.08;
  const retenciones = venta * 0.0903;
  const contador = isFI ? 0 : venta * 0.02;
  const totalCostos = ads + producto + guias + ivaAds + comisionTT + retenciones + contador + costoHost;
  const utilidad = venta - totalCostos;
  const margen = venta > 0 ? (utilidad / venta) * 100 : 0;
  const roas = ads > 0 ? venta / ads : 0;
  const aov = pedidos > 0 ? venta / pedidos : 0;
  return { producto, guias, ivaAds, comisionTT, retenciones, contador, totalCostos, utilidad, margen, roas, aov, usePreciseCost };
}

export default function Lives() {
  const { activeBrand } = useAppStore();
  const { data: livesData, isLoading } = useLives();
  const { data: hostsData } = useHosts();
  const addHostMutation = useAddHost();
  const updateCell = useUpdateCell('lives_analysis');
  const queryClient = useQueryClient();
  const addOfferTest = useAddOfferTest();
  const deleteOfferTest = useDeleteOfferTest();

  const HOSTS = useMemo(() => (hostsData || []).map(h => h.name), [hostsData]);
  const HOST_COLORS: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    (hostsData || []).forEach((h, i) => { map[h.name] = h.color || DEFAULT_HOST_COLORS[i % DEFAULT_HOST_COLORS.length]; });
    return map;
  }, [hostsData]);

  const [hostFilter, setHostFilter] = useState('Todos');
  const [sortKey, setSortKey] = useState<SortKey>('fecha');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showModal, setShowModal] = useState(false);
  const [showAddHost, setShowAddHost] = useState(false);
  const [newHostName, setNewHostName] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [newTest, setNewTest] = useState<{ liveId: string; hora_inicio: string; hora_fin: string; comunicacion: string; ventas: number; pedidos: number; gasto_ads: number } | null>(null);

  // Calculator state
  const [calc, setCalc] = useState({ venta: 0, ads: 0, costoHost: 0, pedidos: 0, productosVendidos: 0, costoUnitario: 0 });

  // All offer tests for filtered lives
  const liveIds = useMemo(() => (livesData || []).map(l => l.id), [livesData]);
  const { data: allOfferTests } = useAllOfferTests(liveIds);

  const filtered = useMemo(() => {
    let rows = (livesData || []).filter(l => hostFilter === 'Todos' || l.host === hostFilter);
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
  const totalAds = filtered.reduce((s, l) => s + (l.ads || 0), 0);
  const avgRoas = filtered.length ? filtered.reduce((s, l) => s + (l.roas_live || 0), 0) / filtered.length : 0;
  const avgMargen = filtered.length ? filtered.reduce((s, l) => s + (l.margen || 0), 0) / filtered.length : 0;

  // Calculator computed
  const calcResults = useMemo(() => computeLiveCosts(activeBrand, calc.venta, calc.ads, calc.costoHost, calc.pedidos, calc.productosVendidos, calc.costoUnitario), [calc, activeBrand]);

  // Cost breakdown for Análisis de Rendimiento — suma costos por live (respeta modo preciso o %)
  const costBreakdown = useMemo(() => {
    if (!filtered.length || totalVentas === 0) return null;
    let producto = 0, guias = 0, ivaAds = 0, comisionTT = 0, retenciones = 0, contador = 0, costoHostTotal = 0, totalCostosAll = 0, utilidadAll = 0;
    for (const l of filtered) {
      const c = computeLiveCosts(activeBrand, l.venta || 0, l.ads || 0, l.costo_host || 0, l.pedidos || 0, (l as any).productos_vendidos || 0, (l as any).costo_unitario_producto || 0);
      producto += c.producto; guias += c.guias; ivaAds += c.ivaAds; comisionTT += c.comisionTT;
      retenciones += c.retenciones; contador += c.contador; costoHostTotal += (l.costo_host || 0);
      totalCostosAll += c.totalCostos; utilidadAll += c.utilidad;
    }
    const items = [
      { name: 'Producto', value: producto, color: '#f97316' },
      { name: 'Guías', value: guias, color: '#3b82f6' },
      { name: 'Ads', value: totalAds, color: '#ef4444' },
      { name: 'IVA Ads', value: ivaAds, color: '#a855f7' },
      { name: 'Comisión TT', value: comisionTT, color: '#22c55e' },
      { name: 'Retenciones', value: retenciones, color: '#eab308' },
      { name: 'Costo Host', value: costoHostTotal, color: '#ec4899' },
    ];
    if (!activeBrand.startsWith('feel')) items.splice(5, 0, { name: 'Contador', value: contador, color: '#06b6d4' });
    const total = items.reduce((s, i) => s + i.value, 0);
    const margenAgg = totalVentas > 0 ? (utilidadAll / totalVentas) * 100 : 0;
    return { items, total, margen: margenAgg, utilidad: utilidadAll };
  }, [filtered, totalVentas, totalAds, activeBrand]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-orange-400" /> : <ChevronDown size={12} className="text-orange-400" />;
  };

  // Inline editing handlers
  const startEdit = (id: string, field: string, currentValue: string | number | null) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue ?? ''));
  };

  const saveEdit = async (id: string, field: string) => {
    setEditingCell(null);
    const row = livesData?.find(l => l.id === id);
    if (!row) return;

    const newVal = field === 'host' || field === 'duracion' || field === 'fecha' ? editValue : Number(editValue) || 0;
    
    // For manual fields, also recompute derived fields
    const manualFields = ['pedidos', 'venta', 'ads', 'costo_host', 'productos_vendidos', 'costo_unitario_producto'];
    if (manualFields.includes(field) || field === 'fecha' || field === 'host' || field === 'duracion') {
      const updatedRow = { ...row, [field]: newVal } as any;
      const v = Number(updatedRow.venta) || 0;
      const a = Number(updatedRow.ads) || 0;
      const ch = Number(updatedRow.costo_host) || 0;
      const p = Number(updatedRow.pedidos) || 0;
      const pv = Number(updatedRow.productos_vendidos) || 0;
      const cu = Number(updatedRow.costo_unitario_producto) || 0;
      const costs = computeLiveCosts(activeBrand, v, a, ch, p, pv, cu);

      const { error } = await supabase.from('lives_analysis').update({
        [field]: newVal,
        mercancias: costs.producto,
        roas_live: costs.roas,
        aov: costs.aov,
        utilidad: costs.utilidad,
        margen: costs.margen / 100,
        gasto_total: costs.totalCostos,
        envio_comision_tt: costs.comisionTT,
        iva_ads: costs.ivaAds,
        impuestos: costs.retenciones,
      } as any).eq('id', id);
      if (error) toast.error('Error: ' + error.message);
      else { toast.success('✓ Guardado'); queryClient.invalidateQueries({ queryKey: ['lives'] }); }
    } else {
      updateCell.mutate({ id, field, value: newVal });
    }
  };

  const EditableTableCell = ({ id, field, value, format, className = '' }: { id: string; field: string; value: string | number | null; format?: (v: number) => string; className?: string }) => {
    const isEditing = editingCell?.id === id && editingCell?.field === field;
    const editable = ['fecha', 'host', 'duracion', 'pedidos', 'venta', 'ads', 'costo_host'].includes(field);

    if (isEditing && editable) {
      return (
        <td className="px-3 py-2">
          {field === 'host' ? (
            <select
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => saveEdit(id, field)}
              autoFocus
              className="bg-[#1a1a1a] border border-orange-500 rounded px-2 py-1 text-xs text-white outline-none w-20"
            >
              {HOSTS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          ) : (
            <input
              type={field === 'fecha' ? 'date' : field === 'duracion' ? 'text' : 'number'}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => saveEdit(id, field)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(id, field); if (e.key === 'Escape') setEditingCell(null); }}
              autoFocus
              className="bg-[#1a1a1a] border border-orange-500 rounded px-2 py-1 text-xs text-white outline-none w-20"
            />
          )}
        </td>
      );
    }

    const display = format && typeof value === 'number' ? format(value) : (value ?? '—');
    return (
      <td
        className={`px-3 py-2 ${editable ? 'cursor-pointer hover:bg-orange-500/10' : ''} ${className}`}
        onClick={editable ? () => startEdit(id, field, value) : undefined}
      >
        {display}
      </td>
    );
  };

  // AI Recommendations (static/computed)
  const isFI = activeBrand === 'feel_ink';
  const roasTarget = isFI ? 4.0 : 1.74;
  const adsPctOfSales = totalVentas > 0 ? (totalAds / totalVentas * 100) : 0;

  if (isLoading) return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-gray-800 rounded w-48" />
      <div className="h-64 bg-gray-800 rounded" />
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Lives Intelligence</p>
          <h1 className="text-2xl font-medium text-white">Análisis de Lives</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto">
            {['Todos', ...HOSTS].map(h => (
              <button key={h} onClick={() => setHostFilter(h)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${hostFilter === h ? 'bg-orange-500 text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white'}`}
              >{h}</button>
            ))}
            <button onClick={() => setShowAddHost(true)}
              className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-[#1e1e1e] text-gray-400 hover:text-white hover:bg-orange-500/20 transition-colors"
              title="Agregar host"
            ><Plus size={12} /></button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
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

      {/* Middle Row: Análisis de Rendimiento + Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Análisis de Rendimiento (2 cols) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Desglose de Costos */}
          <div className="bg-[#111111] rounded-xl border border-gray-800/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={14} className="text-orange-400" />
              <h3 className="text-sm font-medium text-white">Desglose de Costos</h3>
            </div>
            {costBreakdown ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-28 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={costBreakdown.items} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={50} strokeWidth={0}>
                          {costBreakdown.items.map((item, i) => <Cell key={i} fill={item.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatMXN(v)} contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 11 }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1">
                    <p className={`text-2xl font-semibold ${costBreakdown.margen >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {costBreakdown.margen.toFixed(1)}%
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Margen Total</p>
                    <p className={`text-sm font-medium mt-1 ${costBreakdown.utilidad >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatMXN(costBreakdown.utilidad)}
                    </p>
                    <p className="text-[10px] text-gray-500">Utilidad</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {costBreakdown.items.map(item => {
                    const pct = costBreakdown.total > 0 ? (item.value / costBreakdown.total * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] text-gray-400 w-20 truncate">{item.name}</span>
                        <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="text-[10px] text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                        <span className="text-[10px] text-gray-500 w-16 text-right">{formatMXN(item.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Sin datos</p>
            )}
          </div>

          {/* Recomendaciones IA */}
          <div className="bg-[#111111] rounded-xl border border-gray-800/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-orange-400" />
              <h3 className="text-sm font-medium text-white">Recomendaciones IA</h3>
            </div>
            <div className="space-y-3">
              {/* ROAS Target */}
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={12} className="text-orange-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">ROAS Objetivo</span>
                </div>
                <p className="text-lg font-semibold text-white">{roasTarget.toFixed(2)}x</p>
                <p className="text-[10px] text-gray-500">
                  {isFI ? 'Para Feel Ink el ROAS mínimo rentable es 4.0x' : 'Para Skinglow el ROAS mínimo rentable es 1.74x'}
                </p>
                {avgRoas > 0 && (
                  <p className={`text-xs mt-1 ${avgRoas >= roasTarget ? 'text-emerald-400' : 'text-red-400'}`}>
                    {avgRoas >= roasTarget ? '✓ Estás por encima del objetivo' : `✗ Necesitas mejorar ${(roasTarget - avgRoas).toFixed(2)}x`}
                  </p>
                )}
              </div>

              {/* Ad spend insight */}
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={12} className="text-blue-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Gasto Publicitario</span>
                </div>
                {totalVentas > 0 ? (
                  <>
                    <p className="text-sm text-gray-300">
                      Ads representan <span className="text-white font-semibold">{adsPctOfSales.toFixed(1)}%</span> de las ventas
                    </p>
                    {adsPctOfSales > 25 && (
                      <p className="text-[10px] text-yellow-400 mt-1">
                        ⚠ Reducir gasto al 20% mejoraría el ROAS a {(totalVentas / (totalVentas * 0.2)).toFixed(2)}x
                      </p>
                    )}
                    {adsPctOfSales <= 25 && adsPctOfSales > 0 && (
                      <p className="text-[10px] text-emerald-400 mt-1">
                        ✓ Buen ratio de gasto publicitario
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Sin datos suficientes</p>
                )}
              </div>

              {/* Volume recommendation */}
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Radio size={12} className="text-emerald-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Volumen</span>
                </div>
                <p className="text-xs text-gray-300">
                  {filtered.length > 0
                    ? `Promedio por live: ${formatMXN(totalVentas / filtered.length)}. ${filtered.length < 15 ? 'Incrementar frecuencia a 15+ lives/mes puede mejorar resultados.' : '✓ Buena frecuencia de lives.'}`
                    : 'Sin datos suficientes'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Compact Calculator */}
        <div className="bg-[#111111] rounded-xl border border-gray-800/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={14} className="text-orange-400" />
            <h3 className="text-sm font-medium text-white">Calculadora</h3>
            <span className="text-[10px] text-gray-500 ml-auto">{isFI ? 'Feel Ink' : 'Skinglow'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <CalcInput label="Venta Total" value={calc.venta} onChange={v => setCalc(c => ({ ...c, venta: v }))} />
            <CalcInput label="Gasto Ads" value={calc.ads} onChange={v => setCalc(c => ({ ...c, ads: v }))} />
            <CalcInput label="Costo Host" value={calc.costoHost} onChange={v => setCalc(c => ({ ...c, costoHost: v }))} />
            <CalcInput label="Pedidos" value={calc.pedidos} onChange={v => setCalc(c => ({ ...c, pedidos: v }))} />
          </div>
          <div className="border-t border-gray-800 pt-2 space-y-1">
            <CalcRow label="AOV" value={calc.pedidos > 0 ? formatMXN(calcResults.aov) : '—'} />
            <CalcRow label="ROAS" value={calc.ads > 0 ? formatROAS(calcResults.roas) : '—'} />
            <CalcRow label={`Producto (${isFI ? '12' : '24.98'}%)`} value={formatMXN(calcResults.producto)} />
            <CalcRow label="Guías (6%)" value={formatMXN(calcResults.guias)} />
            <CalcRow label="IVA Ads (16%)" value={formatMXN(calcResults.ivaAds)} />
            <CalcRow label="Comisión TT (8%)" value={formatMXN(calcResults.comisionTT)} />
            <CalcRow label="Retenciones (9.03%)" value={formatMXN(calcResults.retenciones)} />
            {!isFI && <CalcRow label="Contador (2%)" value={formatMXN(calcResults.contador)} />}
            <div className="border-t border-gray-700 pt-1.5 mt-1.5">
              <CalcRow label="Total Costos" value={formatMXN(calcResults.totalCostos)} bold />
              <CalcRow label="Utilidad" value={formatMXN(calcResults.utilidad)} bold color={calcResults.utilidad >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              <CalcRow label="Margen %" value={calcResults.margen.toFixed(1) + '%'} bold color={calcResults.margen >= 0 ? 'text-emerald-400' : 'text-red-400'} />
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
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="px-2 py-2.5 w-8"></th>
                {([
                  ['fecha', 'Fecha'], ['host', 'Host'], ['duracion', 'Dur.'],
                  ['pedidos', 'Ped.'], ['venta', 'Venta'], ['ads', 'Ads'],
                  ['roas_live', 'ROAS'], ['mercancias', 'Merc.'], ['guias_calc', 'Guías'],
                  ['comision_calc', 'Com. TT'], ['ret_calc', 'Ret.'], ['iva_calc', 'IVA Ads'],
                  ['costo_host', 'C. Host'], ['utilidad', 'Utilidad'], ['margen', 'Margen'],
                ] as [string, string][]).map(([key, label]) => (
                  <th key={key} onClick={() => ['fecha', 'host', 'venta', 'roas_live', 'utilidad', 'margen'].includes(key) ? toggleSort(key as SortKey) : null}
                    className="px-3 py-2.5 text-left text-[9px] uppercase tracking-wider text-gray-500 font-medium cursor-pointer hover:text-gray-300 select-none whitespace-nowrap"
                  >
                    <span className="flex items-center gap-0.5">{label}
                      {['fecha', 'host', 'venta', 'roas_live', 'utilidad', 'margen'].includes(key) && <SortIcon col={key as SortKey} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const v = l.venta || 0;
                const a = l.ads || 0;
                const ch = l.costo_host || 0;
                const p = l.pedidos || 0;
                const costs = computeLiveCosts(activeBrand, v, a, ch, p);
                const utilColor = costs.margen > 20 ? 'text-emerald-400' : costs.margen >= 0 ? 'text-yellow-400' : 'text-red-400';
                const isExpanded = expandedRows.has(l.id);
                const liveTests = (allOfferTests || []).filter(t => t.live_id === l.id);
                const testCount = liveTests.length;

                return (
                  <Fragment key={l.id}>
                    <tr className="border-b border-gray-800/30 hover:bg-white/[0.02] transition-colors">
                      {/* Expand toggle */}
                      <td className="px-2 py-2 w-8">
                        <button
                          onClick={() => {
                            const next = new Set(expandedRows);
                            isExpanded ? next.delete(l.id) : next.add(l.id);
                            setExpandedRows(next);
                          }}
                          className="text-gray-500 hover:text-orange-400 transition-colors relative"
                        >
                          <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          {testCount > 0 && (
                            <span className="absolute -top-1 -right-1.5 bg-orange-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">{testCount}</span>
                          )}
                        </button>
                      </td>
                      <EditableTableCell id={l.id} field="fecha" value={l.fecha} />
                      <EditableTableCell id={l.id} field="host" value={l.host} />
                      <EditableTableCell id={l.id} field="duracion" value={l.duracion} />
                      <EditableTableCell id={l.id} field="pedidos" value={l.pedidos} />
                      <EditableTableCell id={l.id} field="venta" value={l.venta} format={formatMXN} className="text-white font-medium" />
                      <EditableTableCell id={l.id} field="ads" value={l.ads} format={formatMXN} />
                      <td className="px-3 py-2 text-gray-300">{formatROAS(costs.roas)}</td>
                      <td className="px-3 py-2 text-gray-400">{formatMXN(costs.producto)}</td>
                      <td className="px-3 py-2 text-gray-400">{formatMXN(costs.guias)}</td>
                      <td className="px-3 py-2 text-gray-400">{formatMXN(costs.comisionTT)}</td>
                      <td className="px-3 py-2 text-gray-400">{formatMXN(costs.retenciones)}</td>
                      <td className="px-3 py-2 text-gray-400">{formatMXN(costs.ivaAds)}</td>
                      <EditableTableCell id={l.id} field="costo_host" value={l.costo_host} format={formatMXN} />
                      <td className={`px-3 py-2 font-medium ${utilColor}`}>{formatMXN(costs.utilidad)}</td>
                      <td className={`px-3 py-2 font-medium ${utilColor}`}>{costs.margen.toFixed(1)}%</td>
                    </tr>

                    {/* Expanded: Offer Tests */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={16} className="bg-[#0d0d0d] px-4 py-3 border-b border-gray-800/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FlaskConical size={12} className="text-orange-400" />
                              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Pruebas de Ofertas — {l.fecha} ({l.host})</span>
                            </div>
                            <button
                              onClick={() => setNewTest({ liveId: l.id, hora_inicio: '', hora_fin: '', comunicacion: '', ventas: 0, pedidos: 0, gasto_ads: 0 })}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors"
                            >
                              <Plus size={10} /> Agregar Prueba
                            </button>
                          </div>

                          {/* Inline add form */}
                          {newTest?.liveId === l.id && (
                            <div className="grid grid-cols-7 gap-2 mb-3 items-end">
                              <div>
                                <label className="text-[8px] uppercase text-gray-500 block mb-0.5">Hora inicio</label>
                                <input type="time" value={newTest.hora_inicio} onChange={e => setNewTest(t => t ? { ...t, hora_inicio: e.target.value } : t)}
                                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:border-orange-500 outline-none" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase text-gray-500 block mb-0.5">Hora fin</label>
                                <input type="time" value={newTest.hora_fin} onChange={e => setNewTest(t => t ? { ...t, hora_fin: e.target.value } : t)}
                                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:border-orange-500 outline-none" />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[8px] uppercase text-gray-500 block mb-0.5">Comunicación</label>
                                <input type="text" value={newTest.comunicacion} onChange={e => setNewTest(t => t ? { ...t, comunicacion: e.target.value } : t)}
                                  placeholder="Ej: 2x1 en tatuajes temporales"
                                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:border-orange-500 outline-none" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase text-gray-500 block mb-0.5">Ventas</label>
                                <input type="number" value={newTest.ventas || ''} onChange={e => setNewTest(t => t ? { ...t, ventas: Number(e.target.value) || 0 } : t)}
                                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:border-orange-500 outline-none" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase text-gray-500 block mb-0.5">Pedidos</label>
                                <input type="number" value={newTest.pedidos || ''} onChange={e => setNewTest(t => t ? { ...t, pedidos: Number(e.target.value) || 0 } : t)}
                                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:border-orange-500 outline-none" />
                              </div>
                              <div className="flex items-end gap-1">
                                <div className="flex-1">
                                  <label className="text-[8px] uppercase text-gray-500 block mb-0.5">Ads</label>
                                  <input type="number" value={newTest.gasto_ads || ''} onChange={e => setNewTest(t => t ? { ...t, gasto_ads: Number(e.target.value) || 0 } : t)}
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:border-orange-500 outline-none" />
                                </div>
                                <button
                                  onClick={() => {
                                    if (!newTest.hora_inicio || !newTest.hora_fin) { toast.error('Indica hora inicio y fin'); return; }
                                    addOfferTest.mutate({
                                      live_id: l.id,
                                      brand: activeBrand,
                                      hora_inicio: newTest.hora_inicio,
                                      hora_fin: newTest.hora_fin,
                                      comunicacion: newTest.comunicacion,
                                      ventas: newTest.ventas,
                                      pedidos: newTest.pedidos,
                                      gasto_ads: newTest.gasto_ads,
                                    });
                                    setNewTest(null);
                                  }}
                                  className="px-2 py-1 bg-orange-500 text-white rounded text-[10px] hover:bg-orange-600"
                                >✓</button>
                                <button onClick={() => setNewTest(null)} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-[10px] hover:bg-gray-600">✗</button>
                              </div>
                            </div>
                          )}

                          {/* Tests list */}
                          {liveTests.length > 0 ? (
                            <table className="w-full text-[10px]">
                              <thead>
                                <tr className="text-gray-500 uppercase tracking-wider">
                                  <th className="text-left py-1 px-2">Horario</th>
                                  <th className="text-left py-1 px-2">Comunicación</th>
                                  <th className="text-right py-1 px-2">Ventas</th>
                                  <th className="text-right py-1 px-2">Pedidos</th>
                                  <th className="text-right py-1 px-2">Ads</th>
                                  <th className="text-right py-1 px-2">AOV</th>
                                  <th className="text-right py-1 px-2">ROAS</th>
                                  <th className="w-6"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {liveTests.map(t => {
                                  const tAov = t.pedidos > 0 ? t.ventas / t.pedidos : 0;
                                  const tRoas = t.gasto_ads > 0 ? t.ventas / t.gasto_ads : 0;
                                  return (
                                    <tr key={t.id} className="border-t border-gray-800/30 hover:bg-white/[0.02]">
                                      <td className="py-1.5 px-2 text-gray-300">{t.hora_inicio?.slice(0,5)} → {t.hora_fin?.slice(0,5)}</td>
                                      <td className="py-1.5 px-2 text-white font-medium">{t.comunicacion || '—'}</td>
                                      <td className="py-1.5 px-2 text-right text-gray-300">{formatMXN(t.ventas)}</td>
                                      <td className="py-1.5 px-2 text-right text-gray-300">{t.pedidos}</td>
                                      <td className="py-1.5 px-2 text-right text-gray-300">{formatMXN(t.gasto_ads)}</td>
                                      <td className="py-1.5 px-2 text-right text-gray-300">{tAov > 0 ? formatMXN(tAov) : '—'}</td>
                                      <td className={`py-1.5 px-2 text-right font-medium ${tRoas >= 4 ? 'text-emerald-400' : tRoas >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>{tRoas > 0 ? tRoas.toFixed(2) + 'x' : '—'}</td>
                                      <td className="py-1.5 px-1">
                                        <button onClick={() => deleteOfferTest.mutate(t.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : !newTest && (
                            <p className="text-[10px] text-gray-600 text-center py-2">Sin pruebas registradas. Agrega una para comparar ofertas.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-500">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Comparativa de Ofertas ── */}
      <OfferComparison allOfferTests={allOfferTests || []} filtered={filtered} hostFilter={hostFilter} />

      {/* Add Live Modal */}
      {showModal && <AddLiveModal activeBrand={activeBrand} hosts={HOSTS} onClose={() => setShowModal(false)} onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['lives'] });
        setShowModal(false);
      }} />}

      {/* Add Host Dialog */}
      <Dialog open={showAddHost} onOpenChange={setShowAddHost}>
        <DialogContent className="bg-[#111111] border-gray-800 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Agregar Host</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre del host"
            value={newHostName}
            onChange={e => setNewHostName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newHostName.trim()) {
                addHostMutation.mutate({ name: newHostName.trim() });
                setNewHostName('');
                setShowAddHost(false);
              }
            }}
            className="bg-[#1a1a1a] border-gray-700 text-white"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHost(false)} className="border-gray-700 text-gray-300">Cancelar</Button>
            <Button
              onClick={() => {
                if (!newHostName.trim()) return;
                addHostMutation.mutate({ name: newHostName.trim() });
                setNewHostName('');
                setShowAddHost(false);
              }}
              disabled={!newHostName.trim() || addHostMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <label className="text-[9px] uppercase tracking-wider text-gray-500 font-medium mb-0.5 block">{label}</label>
      <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value) || 0)}
        className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none transition-colors"
        placeholder="0" />
    </div>
  );
}

function CalcRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className={`text-[10px] ${bold ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-[10px] ${bold ? 'font-semibold' : ''} ${color || 'text-gray-300'}`}>{value}</span>
    </div>
  );
}

function AddLiveModal({ activeBrand, hosts, onClose, onSaved }: { activeBrand: string; hosts: string[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '', duracion: '', host: hosts[0] || '',
    pedidos: 0, venta: 0, ads: 0, costo_host: 0,
  });
  const [saving, setSaving] = useState(false);

  const computed = useMemo(() => {
    const { venta, ads, costo_host, pedidos } = form;
    return computeLiveCosts(activeBrand, venta, ads, costo_host, pedidos);
  }, [form, activeBrand]);

  const handleSave = async () => {
    if (!form.fecha || form.venta <= 0) { toast.error('Fecha y Venta son requeridos'); return; }
    setSaving(true);
    const { error } = await supabase.from('lives_analysis').insert({
      brand: activeBrand, fecha: form.fecha, hora: form.hora || null,
      duracion: form.duracion || null, host: form.host, pedidos: form.pedidos,
      venta: form.venta, ads: form.ads, mercancias: computed.producto,
      costo_host: form.costo_host, roas_live: computed.roas, aov: computed.aov,
      utilidad: computed.utilidad, margen: computed.margen / 100,
      gasto_total: computed.totalCostos, envio_comision_tt: computed.comisionTT,
      iva_ads: computed.ivaAds, impuestos: computed.retenciones,
    });
    setSaving(false);
    if (error) { toast.error('Error: ' + error.message); return; }
    toast.success('Live agregado'); onSaved();
  };

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));
  const isFI = activeBrand === 'feel_ink';

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
            <select value={form.host} onChange={e => set('host', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none">
              {hosts.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <ModalField label="Pedidos" type="number" value={form.pedidos} onChange={v => set('pedidos', Number(v) || 0)} />
          <ModalField label="Venta Total" type="number" value={form.venta} onChange={v => set('venta', Number(v) || 0)} />
          <ModalField label="Gasto Ads" type="number" value={form.ads} onChange={v => set('ads', Number(v) || 0)} />
          <ModalField label="Costo Host" type="number" value={form.costo_host} onChange={v => set('costo_host', Number(v) || 0)} />
        </div>

        {/* Computed preview */}
        <div className="bg-[#0a0a0a] rounded-lg p-3 space-y-1 border border-gray-800">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Valores Calculados ({isFI ? 'Feel Ink' : 'Skinglow'})</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">ROAS</span><span className="text-gray-300">{formatROAS(computed.roas)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">AOV</span><span className="text-gray-300">{computed.aov > 0 ? formatMXN(computed.aov) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Producto</span><span className="text-gray-300">{formatMXN(computed.producto)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Guías</span><span className="text-gray-300">{formatMXN(computed.guias)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Com. TT</span><span className="text-gray-300">{formatMXN(computed.comisionTT)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Ret.</span><span className="text-gray-300">{formatMXN(computed.retenciones)}</span></div>
          </div>
          <div className="border-t border-gray-800 pt-1 mt-1 flex justify-between text-xs">
            <span className="text-gray-500">Utilidad</span>
            <span className={computed.utilidad >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatMXN(computed.utilidad)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Margen</span>
            <span className={computed.margen >= 0 ? 'text-emerald-400' : 'text-red-400'}>{computed.margen.toFixed(1)}%</span>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
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
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors" />
    </div>
  );
}

function OfferComparison({ allOfferTests, filtered, hostFilter }: { allOfferTests: any[]; filtered: any[]; hostFilter: string }) {
  const [open, setOpen] = useState(false);

  const comparison = useMemo(() => {
    const filteredIds = new Set(filtered.map(l => l.id));
    const relevant = allOfferTests.filter(t => filteredIds.has(t.live_id));
    if (!relevant.length) return [];

    const grouped: Record<string, { comunicacion: string; ventas: number; pedidos: number; gasto_ads: number; count: number }> = {};
    for (const t of relevant) {
      const key = (t.comunicacion || '').toLowerCase().trim();
      if (!key) continue;
      if (!grouped[key]) grouped[key] = { comunicacion: t.comunicacion, ventas: 0, pedidos: 0, gasto_ads: 0, count: 0 };
      grouped[key].ventas += t.ventas || 0;
      grouped[key].pedidos += t.pedidos || 0;
      grouped[key].gasto_ads += t.gasto_ads || 0;
      grouped[key].count += 1;
    }
    return Object.values(grouped).sort((a, b) => b.ventas - a.ventas);
  }, [allOfferTests, filtered]);

  if (!comparison.length) return null;

  return (
    <div className="bg-[#111111] rounded-xl border border-gray-800/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className="text-orange-400" />
          <h3 className="text-sm font-medium text-white">Comparativa de Ofertas</h3>
          <span className="text-[10px] text-gray-500">({comparison.length} comunicaciones)</span>
        </div>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-gray-500 border-b border-gray-800/60">
                <th className="text-left py-2 px-2">Comunicación</th>
                <th className="text-right py-2 px-2"># Pruebas</th>
                <th className="text-right py-2 px-2">Ventas Total</th>
                <th className="text-right py-2 px-2">Pedidos</th>
                <th className="text-right py-2 px-2">AOV Prom</th>
                <th className="text-right py-2 px-2">ROAS Prom</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c, i) => {
                const aov = c.pedidos > 0 ? c.ventas / c.pedidos : 0;
                const roas = c.gasto_ads > 0 ? c.ventas / c.gasto_ads : 0;
                return (
                  <tr key={i} className="border-b border-gray-800/30 hover:bg-white/[0.02]">
                    <td className="py-2 px-2 text-white font-medium">{c.comunicacion}</td>
                    <td className="py-2 px-2 text-right text-gray-400">{c.count}</td>
                    <td className="py-2 px-2 text-right text-gray-300">{formatMXN(c.ventas)}</td>
                    <td className="py-2 px-2 text-right text-gray-300">{c.pedidos}</td>
                    <td className="py-2 px-2 text-right text-gray-300">{aov > 0 ? formatMXN(aov) : '—'}</td>
                    <td className={`py-2 px-2 text-right font-medium ${roas >= 4 ? 'text-emerald-400' : roas >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {roas > 0 ? roas.toFixed(2) + 'x' : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
