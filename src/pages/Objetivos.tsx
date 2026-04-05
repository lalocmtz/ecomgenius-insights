import { useObjetivos, useUpdateObjetivo, APRIL_WEEKS, type Objetivo } from '@/hooks/useObjetivos';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN } from '@/lib/formatters';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PERIODOS = ['ABR-2026', 'MAR-2026', 'FEB-2026', 'ENE-2026'];

function formatValue(val: number | null | undefined, unidad: string | null) {
  if (val == null) return '—';
  if (unidad === 'MXN') return formatMXN(val);
  if (unidad === '%') return `${val.toFixed(1)}%`;
  if (unidad === 'x') return `${val.toFixed(2)}x`;
  return `${val}`;
}

function semaforoColor(s: string | null) {
  if (s === '🟢') return 'bg-emerald-500';
  if (s === '🔴') return 'bg-red-500';
  return 'bg-yellow-500';
}

export default function Objetivos() {
  const { activeBrand } = useAppStore();
  const [periodo, setPeriodo] = useState('ABR-2026');
  const { data: objetivos, isLoading } = useObjetivos(periodo);
  const updateObj = useUpdateObjetivo();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const greenCount = (objetivos || []).filter(o => o.semaforo === '🟢').length;
  const totalCount = (objetivos || []).length;

  const handleFeedbackChange = (obj: Objetivo, weekLabel: string, text: string) => {
    const feedback = [...(obj.weekly_feedback || [])];
    const idx = feedback.findIndex((f: any) => f.week === weekLabel);
    if (idx >= 0) {
      feedback[idx] = { ...feedback[idx], text };
    } else {
      feedback.push({ week: weekLabel, text });
    }
    updateObj.mutate({ id: obj.id, field: 'weekly_feedback', value: feedback });
  };

  const getFeedback = (obj: Objetivo, weekLabel: string) => {
    return (obj.weekly_feedback || []).find((f: any) => f.week === weekLabel)?.text || '';
  };

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
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-foreground font-medium">{greenCount} de {totalCount} objetivos en verde</span>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm text-foreground">{(objetivos || []).filter(o => o.semaforo === '🟡').length} en camino</span>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-foreground">{(objetivos || []).filter(o => o.semaforo === '🔴').length} en riesgo</span>
        </div>
      </div>

      {/* Objetivos Cards */}
      {totalCount === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-border">
          No hay objetivos cargados para este periodo.
        </div>
      ) : (
        <div className="space-y-3">
          {(objetivos || []).map(obj => {
            const actual = obj.computed_actual ?? obj.actual_value ?? 0;
            const meta = obj.meta_value ?? 1;
            const pct = meta > 0 ? (actual / meta) * 100 : 0;
            const isOpen = expanded.has(obj.id);

            return (
              <div key={obj.id} className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Main row */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => toggle(obj.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${semaforoColor(obj.semaforo)}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{obj.objetivo}</p>
                      {obj.responsable && (
                        <p className="text-[11px] text-muted-foreground">{obj.responsable} · {obj.canal || 'Manual'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-foreground font-medium">
                        {formatValue(actual, obj.unidad)} / {formatValue(meta, obj.unidad)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</p>
                    </div>
                    <div className="w-28 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <select
                      value={obj.semaforo || '🟡'}
                      onChange={e => { e.stopPropagation(); updateObj.mutate({ id: obj.id, field: 'semaforo', value: e.target.value }); }}
                      onClick={e => e.stopPropagation()}
                      className="bg-secondary border border-border rounded px-2 py-1 text-sm"
                    >
                      <option value="🟢">🟢</option>
                      <option value="🟡">🟡</option>
                      <option value="🔴">🔴</option>
                    </select>
                    {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded: Weekly breakdown */}
                {isOpen && (
                  <div className="border-t border-border p-4 space-y-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Desglose Semanal</p>
                    <div className="grid grid-cols-5 gap-3">
                      {APRIL_WEEKS.map(week => {
                        const weekVal = obj.weekly_totals?.[week.label] ?? 0;
                        return (
                          <div key={week.label} className="bg-secondary/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">{week.label}</span>
                              <span className="text-[10px] text-muted-foreground">{week.from.slice(5)} → {week.to.slice(5)}</span>
                            </div>
                            {obj.canal ? (
                              <p className="text-sm font-medium text-foreground">{formatValue(weekVal, obj.unidad)}</p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground italic">Manual</p>
                            )}
                            <Textarea
                              placeholder="Feedback..."
                              className="text-xs min-h-[50px] bg-background/50 border-border/50"
                              defaultValue={getFeedback(obj, week.label)}
                              onBlur={e => handleFeedbackChange(obj, week.label, e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
