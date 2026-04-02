import { useOKRs, useUpdateCell } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { EditableCell } from '@/components/EditableCell';
import { formatMXN, formatPct } from '@/lib/formatters';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusEmoji: Record<string, string> = {
  'en_camino': '🟡',
  'en_riesgo': '🔴',
  'logrado': '🟢',
  'no_iniciado': '⚪',
};

export default function OKRs() {
  const { activeBrand } = useAppStore();
  const { data: okrs, isLoading } = useOKRs();
  const updateCell = useUpdateCell('okrs');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const statusCounts = {
    logrado: (okrs || []).filter(o => o.status === 'logrado').length,
    en_camino: (okrs || []).filter(o => o.status === 'en_camino').length,
    en_riesgo: (okrs || []).filter(o => o.status === 'en_riesgo').length,
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary rounded" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-foreground">OKRs</h1>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2">
          <span>🟢</span><span className="text-sm text-foreground">{statusCounts.logrado} Logrados</span>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2">
          <span>🟡</span><span className="text-sm text-foreground">{statusCounts.en_camino} En camino</span>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2">
          <span>🔴</span><span className="text-sm text-foreground">{statusCounts.en_riesgo} En riesgo</span>
        </div>
      </div>

      {/* OKR Table */}
      <div className="space-y-3">
        {(okrs || []).map(okr => {
          const krItems = (okr.kr_items as any[]) || [];
          const isExpanded = expanded.has(okr.id);
          const overallProgress = krItems.length
            ? krItems.reduce((s, kr) => s + Math.min(100, (kr.actual / kr.meta) * 100), 0) / krItems.length
            : 0;

          return (
            <div key={okr.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle(okr.id)}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{statusEmoji[okr.status || 'no_iniciado']}</span>
                  <div>
                    <span className="text-sm font-medium text-foreground">{okr.objetivo}</span>
                    <p className="text-[10px] text-muted-foreground">{okr.periodo} · {activeBrand === 'feel_ink' ? 'Feel Ink' : 'Skinglow'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{Math.round(overallProgress)}%</span>
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${overallProgress}%` }} />
                  </div>
                  <select
                    value={okr.status || 'en_camino'}
                    onChange={(e) => { e.stopPropagation(); updateCell.mutate({ id: okr.id, field: 'status', value: e.target.value }); }}
                    className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground"
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="en_camino">En camino</option>
                    <option value="en_riesgo">En riesgo</option>
                    <option value="logrado">Logrado</option>
                    <option value="no_iniciado">No iniciado</option>
                  </select>
                </div>
              </div>

              {isExpanded && krItems.length > 0 && (
                <div className="mt-4 pl-8 space-y-3 border-t border-border pt-3">
                  {krItems.map((kr: any, i: number) => {
                    const pct = Math.min(100, (kr.actual / kr.meta) * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{kr.name}</span>
                          <span className="text-foreground">
                            {kr.unidad === 'MXN' ? `${formatMXN(kr.actual)} / ${formatMXN(kr.meta)}` :
                             `${kr.actual}${kr.unidad} / ${kr.meta}${kr.unidad}`}
                            {' '}({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-status-good' : pct >= 70 ? 'bg-status-warning' : 'bg-status-critical'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!okrs?.length && <div className="text-center py-8 text-muted-foreground">Sin OKRs configurados</div>}
      </div>
    </div>
  );
}
