import { useDailyMetrics, useUpdateCell } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { EditableCell } from '@/components/EditableCell';
import { formatMXN } from '@/lib/formatters';
import { Plus, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Ventas() {
  const { activeBrand } = useAppStore();
  const { data: metrics, isLoading } = useDailyMetrics();
  const updateCell = useUpdateCell('daily_metrics');

  const chartData = useMemo(() => {
    if (!metrics?.length) return [];
    const byDate: Record<string, Record<string, number>> = {};
    metrics.forEach(m => {
      if (!byDate[m.date]) byDate[m.date] = {};
      byDate[m.date][m.canal] = (byDate[m.date][m.canal] || 0) + (m.ventas_brutas || 0);
    });
    return Object.entries(byDate).sort().map(([date, canals]) => ({ date: date.slice(5), ...canals }));
  }, [metrics]);

  const addDay = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_metrics').insert({ brand: activeBrand, date: today, canal: 'tiktok', ventas_brutas: 0, pedidos: 0 });
    if (error) toast.error(error.message); else toast.success('Día agregado');
  };

  const exportCSV = () => {
    if (!metrics?.length) return;
    const headers = ['Fecha', 'Canal', 'Ventas', 'Pedidos', 'Ads', 'COGS'];
    const rows = metrics.map(m => [m.date, m.canal, m.ventas_brutas, m.pedidos, m.anuncios, m.cogs]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ventas.csv'; a.click();
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary rounded" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
          <h1 className="text-2xl font-medium text-foreground">Ventas</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={addDay} className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg"><Plus size={14} /> Agregar día</button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary"><Download size={14} /> CSV</button>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">Ventas por Canal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip />
              <Legend />
              <Bar dataKey="tiktok" stackId="a" fill="hsl(14,100%,57%)" name="TikTok" />
              <Bar dataKey="shopify" stackId="a" fill="hsl(217,91%,60%)" name="Shopify" />
              <Bar dataKey="meta" stackId="a" fill="hsl(142,71%,45%)" name="Meta" />
              <Bar dataKey="mayoreo" stackId="a" fill="hsl(48,96%,53%)" name="Mayoreo" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Fecha', 'Canal', 'Ventas Brutas', 'Pedidos', 'Ads', 'COGS'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(metrics || []).map(m => (
              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/10">
                <td className="px-4 py-3 text-foreground">{m.date}</td>
                <td className="px-4 py-3 text-primary font-medium">{m.canal}</td>
                <td className="px-4 py-3"><EditableCell value={m.ventas_brutas} onSave={v => updateCell.mutate({ id: m.id, field: 'ventas_brutas', value: parseFloat(v) })} type="number" /></td>
                <td className="px-4 py-3"><EditableCell value={m.pedidos} onSave={v => updateCell.mutate({ id: m.id, field: 'pedidos', value: parseInt(v) })} type="number" /></td>
                <td className="px-4 py-3"><EditableCell value={m.anuncios} onSave={v => updateCell.mutate({ id: m.id, field: 'anuncios', value: parseFloat(v) })} type="number" /></td>
                <td className="px-4 py-3 text-muted-foreground">{formatMXN(m.cogs || 0)}</td>
              </tr>
            ))}
            {!metrics?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin datos — agrega métricas diarias</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
