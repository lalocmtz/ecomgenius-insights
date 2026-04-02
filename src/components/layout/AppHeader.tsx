import { useAppStore, Brand } from '@/store/useAppStore';
import { Bell, User, Pencil, Eye } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useAgentDailyRuns } from '@/hooks/useSupabaseData';

export function AppHeader() {
  const { activeBrand, setActiveBrand, editMode, setEditMode } = useAppStore();
  const { data: dailyRuns } = useAgentDailyRuns();

  const lastRun = dailyRuns?.[0];
  const lastRunAge = lastRun?.ran_at ? (Date.now() - new Date(lastRun.ran_at).getTime()) / 3600000 : null;
  const statusColor = lastRunAge === null ? 'bg-muted' : lastRunAge < 2 ? 'bg-status-good' : lastRunAge < 6 ? 'bg-status-warning' : 'bg-status-critical';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[60px] border-b border-border bg-background flex items-center px-4 gap-4 transition-colors duration-300">
      <div className="flex items-center gap-2 min-w-[180px]">
        <span className="text-lg font-medium text-foreground tracking-tight">EcomGenius</span>
      </div>

      <div className="flex items-center bg-secondary rounded-full p-0.5">
        <BrandButton brand="feel_ink" active={activeBrand} onClick={setActiveBrand} label="Feel Ink" />
        <BrandButton brand="skinglow" active={activeBrand} onClick={setActiveBrand} label="Skinglow" />
      </div>

      <div className="flex-1" />

      <DateRangePicker />

      <button
        onClick={() => setEditMode(!editMode)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
      >
        {editMode ? <><Pencil size={12} /> Editando</> : <><Eye size={12} /> Ver</>}
      </button>

      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} title="Estado agentes IA" />
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User size={14} className="text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}

function BrandButton({ brand, active, onClick, label }: {
  brand: Brand; active: Brand; onClick: (b: Brand) => void; label: string;
}) {
  const isActive = brand === active;
  return (
    <button
      onClick={() => onClick(brand)}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {isActive && '◆ '}{label}
    </button>
  );
}
