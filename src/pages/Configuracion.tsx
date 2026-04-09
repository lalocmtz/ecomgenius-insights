import { useState } from 'react';
import { Settings as SettingsIcon, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Configuracion() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-triple-whale', {
        body: { brands: ['feel_ink', 'skinglow'] },
      });
      if (error) throw error;
      setLastSync(new Date().toLocaleString('es-MX'));
      toast.success('Sincronización completada');
    } catch (err: any) {
      setSyncError(err.message || 'Error al sincronizar');
      toast.error('Error al sincronizar: ' + (err.message || 'desconocido'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-foreground">Configuración</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sincronización de Datos */}
        <div className="bg-card rounded-lg border border-border p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Sincronización de Datos — Triple Whale</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Conecta tu cuenta de Triple Whale para importar automáticamente los datos de ventas, ads y métricas de todos los canales (Meta, TikTok Ads, GMV Max, Lives, Google).
          </p>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </button>
            {lastSync && (
              <div className="flex items-center gap-1 text-xs text-status-good">
                <CheckCircle size={12} />
                <span>Última sync: {lastSync}</span>
              </div>
            )}
            {syncError && (
              <div className="flex items-center gap-1 text-xs text-status-critical">
                <AlertCircle size={12} />
                <span>{syncError}</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            La sincronización automática se ejecuta diariamente. Los datos se actualizan en daily_metrics y lives_analysis.
          </div>
        </div>

        {/* Usuarios */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Usuarios</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">AD</div>
                <div>
                  <span className="text-sm text-foreground">Admin User</span>
                  <p className="text-[10px] text-muted-foreground">admin@ecomgenius.mx</p>
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin</span>
            </div>
          </div>
        </div>

        {/* Agentes */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Agentes IA</h3>
          <div className="space-y-2">
            {['Director', 'Financiero', 'Publicidad', 'Lives', 'Logística', 'Datos', 'Creativo'].map(agent => (
              <div key={agent} className="flex items-center justify-between p-2 hover:bg-secondary rounded-lg">
                <span className="text-sm text-foreground">{agent}</span>
                <div className="w-8 h-4 bg-primary rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-primary-foreground rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">API Keys</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Lovable AI</span>
              <span className="text-status-good text-xs">✓ Configurada</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Lovable Cloud</span>
              <span className="text-status-good text-xs">✓ Conectada</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Triple Whale</span>
              <span className="text-status-warning text-xs">⚠ Pendiente</span>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Exportar Datos</h3>
          <div className="space-y-2">
            {['Lives', 'KPIs', 'OKRs', 'Métricas'].map(table => (
              <button key={table} className="flex items-center gap-2 w-full px-3 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary">
                <Download size={14} /> Exportar {table} (CSV)
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
