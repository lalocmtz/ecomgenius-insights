import { useDailyMetrics, useKPIs } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { formatMXN, formatPct } from '@/lib/formatters';
import { Store, AlertTriangle, TrendingUp, CreditCard } from 'lucide-react';

export default function ShopifyPage() {
  const { activeBrand } = useAppStore();
  const { data: metrics, isLoading } = useDailyMetrics('shopify');
  const { data: kpis } = useKPIs();

  const isSG = activeBrand === 'skinglow';
  const totalVentas = (metrics || []).reduce((s, m) => s + (m.ventas_brutas || 0), 0);
  const totalPedidos = (metrics || []).reduce((s, m) => s + (m.pedidos || 0), 0);
  const ticket = totalPedidos ? totalVentas / totalPedidos : 0;
  const totalDescuentos = (metrics || []).reduce((s, m) => s + (m.descuentos || 0), 0);
  const pctDescuento = totalVentas ? (totalDescuentos / totalVentas) * 100 : 0;

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary rounded" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-foreground">Shopify</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ventas" value={formatMXN(totalVentas)} icon={<TrendingUp size={16} />} />
        <KpiCard label="Pedidos" value={String(totalPedidos)} icon={<Store size={16} />} />
        <KpiCard label="Ticket Promedio" value={formatMXN(ticket)} icon={<CreditCard size={16} />} />
        <KpiCard label="% Descuento" value={formatPct(pctDescuento)} icon={<AlertTriangle size={16} />} status={pctDescuento > 30 ? 'critical' : undefined} />
      </div>

      {/* Skinglow Alerts */}
      {isSG && (
        <div className="bg-card rounded-lg border border-status-critical/30 p-5">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-status-critical" /> Alertas Skinglow</h3>
          <div className="space-y-3">
            {[
              { label: 'Descuento promedio', value: '33.9%', meta: '<25%', status: 'critico' },
              { label: 'Retención clientes', value: '6.89%', meta: '>12%', status: 'critico' },
              { label: 'Dependencia Crema Aclarante', value: '77%', meta: 'Diversificar', status: 'alerta' },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between p-3 bg-status-critical/5 rounded-lg">
                <span className="text-sm text-foreground">{a.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-status-critical">{a.value}</span>
                  <span className="text-xs text-muted-foreground">Meta: {a.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            {['Fecha', 'Ventas', 'Pedidos', 'Descuentos', 'Devoluciones'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {(metrics || []).map(m => (
              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/10">
                <td className="px-4 py-3 text-foreground">{m.date}</td>
                <td className="px-4 py-3 text-foreground">{formatMXN(m.ventas_brutas || 0, true)}</td>
                <td className="px-4 py-3 text-foreground">{m.pedidos}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatMXN(m.descuentos || 0)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatMXN(m.devoluciones || 0)}</td>
              </tr>
            ))}
            {!metrics?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin datos Shopify</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, status }: { label: string; value: string; icon: React.ReactNode; status?: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className={status === 'critical' ? 'text-status-critical' : 'text-muted-foreground'}>{icon}</span>
      </div>
      <div className={`text-2xl font-medium ${status === 'critical' ? 'text-status-critical' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
