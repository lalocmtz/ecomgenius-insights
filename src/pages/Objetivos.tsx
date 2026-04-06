import { useObjetivos, useUpdateObjetivo, useCreateObjetivo, type Objetivo } from '@/hooks/useObjetivos';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN } from '@/lib/formatters';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const PERIODOS = ['ABR-2026', 'MAR-2026', 'FEB-2026', 'ENE-2026'];
const DATA_SOURCES = ['Meta', 'Google', 'GMV Max', 'TikTok Lives', 'TikTok Ads', 'Orgánico', 'Ninguno'];
const TIPOS = ['ventas', 'lives', 'operativo'];

const DAY_OF_MONTH = new Date().getDate();
const DAYS_IN_MONTH = 30; // April
const EXPECTED_PCT = (DAY_OF_MONTH / DAYS_IN_MONTH) * 100;

function calcSemaforo(pct: number): string {
  if (pct >= EXPECTED_PCT) return '🟢';
  if (pct >= EXPECTED_PCT * 0.5) return '🟡';
  return '🔴';
}

function semaforoColor(s: string) {
  if (s === '🟢') return 'text-emerald-500';
  if (s === '🔴') return 'text-red-500';
  return 'text-yellow-500';
}

function ringColor(s: string) {
  if (s === '🟢') return 'stroke-emerald-500';
  if (s === '🔴') return 'stroke-red-500';
  return 'stroke-yellow-500';
}

function ringBg(s: string) {
  if (s === '🟢') return 'stroke-emerald-500/20';
  if (s === '🔴') return 'stroke-red-500/20';
  return 'stroke-yellow-500/20';
}

// Debounced field component
function DebouncedInput({ value, onSave, type = 'number', className = '' }: {
  value: number | string | null;
  onSave: (v: string) => void;
  type?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(String(value ?? ''));
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocal(String(value ?? '')); }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(v), 800);
  };

  return (
    <Input
      type={type}
      value={local}
      onChange={e => handleChange(e.target.value)}
      className={`h-8 text-xs bg-secondary border-border ${className}`}
    />
  );
}

function DebouncedTextarea({ value, onSave, placeholder }: {
  value: string | null;
  onSave: (v: string) => void;
  placeholder: string;
}) {
  const [local, setLocal] = useState(value ?? '');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocal(value ?? ''); }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(v), 800);
  };

  return (
    <Textarea
      value={local}
      onChange={e => handleChange(e.target.value)}
      placeholder={placeholder}
      className="text-xs min-h-[60px] bg-secondary border-border resize-none"
    />
  );
}

// Ring chart SVG
function ProgressRing({ pct, semaforo, label, size = 100 }: { pct: number; semaforo: string; label: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} className={ringBg(semaforo)} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8}
          className={ringColor(semaforo)} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-bold text-foreground">{pct.toFixed(0)}%</span>
      </div>
      <p className="text-[10px] text-muted-foreground text-center truncate max-w-[110px]">{label}</p>
    </div>
  );
}

export default function Objetivos() {
  const { activeBrand } = useAppStore();
  const [periodo, setPeriodo] = useState('ABR-2026');
  const { data: objetivos, isLoading } = useObjetivos(periodo);
  const updateObj = useUpdateObjetivo();
  const createObj = useCreateObjetivo();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    objetivo: '', tipo: 'ventas', responsable: '',
    meta_value: '', meta_roas: '', presupuesto_mensual: '', data_source: 'Ninguno',
  });

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const saveField = useCallback((id: string, field: string, value: string) => {
    const numFields = ['resultado_venta', 'presupuesto_invertido', 'cantidad_lives', 'horas_lives'];
    const parsed = numFields.includes(field) ? (value === '' ? 0 : Number(value)) : value;
    updateObj.mutate({ id, field, value: parsed });
  }, [updateObj]);

  const handleCreate = () => {
    if (!form.objetivo || !form.responsable) return;
    createObj.mutate({
      brand: activeBrand,
      periodo,
      objetivo: form.objetivo,
      tipo: form.tipo,
      responsable: form.responsable,
      meta_value: form.meta_value ? Number(form.meta_value) : null,
      meta_roas: form.meta_roas ? Number(form.meta_roas) : null,
      presupuesto_mensual: form.presupuesto_mensual ? Number(form.presupuesto_mensual) : null,
      data_source: form.data_source,
    }, {
      onSuccess: () => {
        setShowModal(false);
        setForm({ objetivo: '', tipo: 'ventas', responsable: '', meta_value: '', meta_roas: '', presupuesto_mensual: '', data_source: 'Ninguno' });
      }
    });
  };

  // Compute derived values for each objetivo
  const enriched = (objetivos || []).map(obj => {
    const meta = obj.meta_value ?? 0;
    const resultado = obj.resultado_venta ?? 0;
    const presupuesto = obj.presupuesto_mensual ?? 0;
    const invertido = obj.presupuesto_invertido ?? 0;
    const pct = meta > 0 ? (resultado / meta) * 100 : 0;
    const ventaEsperada = meta > 0 ? (meta / DAYS_IN_MONTH) * DAY_OF_MONTH : 0;
    const presupuestoEsperado = presupuesto > 0 ? (presupuesto / DAYS_IN_MONTH) * DAY_OF_MONTH : 0;
    const roasActual = invertido > 0 ? resultado / invertido : 0;
    const semaforo = meta > 0 ? calcSemaforo(pct) : (obj.semaforo || '🟡');
    return { ...obj, pct, ventaEsperada, presupuestoEsperado, roasActual, semaforo, resultado, invertido, meta, presupuesto };
  });

  const onTrack = enriched.filter(o => o.semaforo === '🟢').length;

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary rounded" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
          <h1 className="text-2xl font-medium text-foreground">Objetivos</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <Button onClick={() => setShowModal(true)} size="sm" className="gap-1">
            <Plus size={14} /> Agregar Objetivo
          </Button>
        </div>
      </div>

      {/* Ring Dashboard */}
      {enriched.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {enriched.filter(o => o.meta > 0).map(obj => (
              <div key={obj.id} className="relative flex flex-col items-center">
                <ProgressRing pct={obj.pct} semaforo={obj.semaforo} label={obj.objetivo} />
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-muted-foreground">
              {onTrack} de {enriched.length} objetivos en línea · Día {DAY_OF_MONTH}/30 ({EXPECTED_PCT.toFixed(0)}% esperado)
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {enriched.length === 0 && (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-border">
          No hay objetivos cargados para este periodo.
        </div>
      )}

      {/* Objective Cards */}
      <div className="space-y-3">
        {enriched.map(obj => {
          const isOpen = expanded.has(obj.id);
          return (
            <div key={obj.id} className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Header row */}
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => toggle(obj.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Target size={16} className={semaforoColor(obj.semaforo)} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{obj.objetivo}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {obj.responsable} · {obj.tipo} · {obj.data_source || obj.canal || 'Manual'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {obj.meta > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">
                        {formatMXN(obj.resultado)} / {formatMXN(obj.meta)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{obj.pct.toFixed(1)}%</p>
                    </div>
                  )}
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${obj.semaforo === '🟢' ? 'bg-emerald-500' : obj.semaforo === '🟡' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, obj.pct)}%` }} />
                  </div>
                  {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Subheader */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {obj.meta > 0 && <span>Meta: {formatMXN(obj.meta)}</span>}
                    {obj.presupuesto > 0 && <span>Presupuesto: {formatMXN(obj.presupuesto)}</span>}
                    {obj.meta_roas && <span>ROAS objetivo: {obj.meta_roas}x</span>}
                  </div>

                  {/* KPIs mini-table */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {obj.meta > 0 && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Venta esperada</p>
                        <p className="text-sm font-medium text-foreground">{formatMXN(obj.ventaEsperada)}</p>
                      </div>
                    )}
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                        Resultado venta
                        {obj.is_auto && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">auto</span>}
                      </p>
                      {obj.is_auto ? (
                        <p className="text-sm font-medium text-foreground">{formatMXN(obj.resultado)}</p>
                      ) : (
                        <DebouncedInput value={obj.resultado} onSave={v => saveField(obj.id, 'resultado_venta', v)} />
                      )}
                    </div>
                    {obj.presupuesto > 0 && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Presup. esperado</p>
                        <p className="text-sm font-medium text-foreground">{formatMXN(obj.presupuestoEsperado)}</p>
                      </div>
                    )}
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                        Presup. invertido
                        {obj.is_auto && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">auto</span>}
                      </p>
                      {obj.is_auto ? (
                        <p className="text-sm font-medium text-foreground">{formatMXN(obj.invertido)}</p>
                      ) : (
                        <DebouncedInput value={obj.invertido} onSave={v => saveField(obj.id, 'presupuesto_invertido', v)} />
                      )}
                    </div>
                    {obj.invertido > 0 && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">ROAS actual</p>
                        <p className="text-sm font-medium text-foreground">{obj.roasActual.toFixed(2)}x</p>
                      </div>
                    )}
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">% Avance</p>
                      <p className={`text-sm font-bold ${semaforoColor(obj.semaforo)}`}>{obj.pct.toFixed(1)}%</p>
                    </div>

                    {obj.tipo === 'lives' && (
                      <>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <p className="text-[10px] text-muted-foreground uppercase">Cantidad lives</p>
                          <DebouncedInput value={obj.cantidad_lives} onSave={v => saveField(obj.id, 'cantidad_lives', v)} />
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <p className="text-[10px] text-muted-foreground uppercase">Horas lives</p>
                          <DebouncedInput value={obj.horas_lives} onSave={v => saveField(obj.id, 'horas_lives', v)} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">✅ ¿Qué está funcionando? ¿Podemos escalar?</p>
                      <DebouncedTextarea value={obj.comentarios_bien} onSave={v => saveField(obj.id, 'comentarios_bien', v)} placeholder="Lo que funciona..." />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">❌ ¿Cuál es el problema? ¿Se está solucionando?</p>
                      <DebouncedTextarea value={obj.comentarios_mal} onSave={v => saveField(obj.id, 'comentarios_mal', v)} placeholder="Problemas..." />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">🔧 Tareas prioritarias siguiente semana</p>
                      <DebouncedTextarea value={obj.tareas_prioritarias} onSave={v => saveField(obj.id, 'tareas_prioritarias', v)} placeholder="Tareas..." />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Objetivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nombre del objetivo *</Label>
              <Input value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} placeholder="Ej: Ventas Meta Ads" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo *</Label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Responsable *</Label>
                <Input value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} placeholder="Nombre" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Meta venta (MXN)</Label>
                <Input type="number" value={form.meta_value} onChange={e => setForm(f => ({ ...f, meta_value: e.target.value }))} placeholder="450000" />
              </div>
              <div>
                <Label className="text-xs">Meta ROAS</Label>
                <Input type="number" value={form.meta_roas} onChange={e => setForm(f => ({ ...f, meta_roas: e.target.value }))} placeholder="3" />
              </div>
              <div>
                <Label className="text-xs">Presupuesto</Label>
                <Input type="number" value={form.presupuesto_mensual} onChange={e => setForm(f => ({ ...f, presupuesto_mensual: e.target.value }))} placeholder="83333" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Data source / Canal</Label>
              <select value={form.data_source} onChange={e => setForm(f => ({ ...f, data_source: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {DATA_SOURCES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.objetivo || !form.responsable}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
