import { useAppStore, Brand } from '@/store/useAppStore';
import { Bell, User } from 'lucide-react';

export function AppHeader() {
  const { activeBrand, setActiveBrand } = useAppStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[60px] border-b border-border bg-background flex items-center px-4 gap-4 transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-[180px]">
        <span className="text-lg font-medium text-foreground tracking-tight">EcomGenius</span>
      </div>

      {/* Brand Switcher */}
      <div className="flex items-center bg-secondary rounded-full p-0.5">
        <BrandButton brand="feel_ink" active={activeBrand} onClick={setActiveBrand} label="Feel Ink" />
        <BrandButton brand="skinglow" active={activeBrand} onClick={setActiveBrand} label="Skinglow" />
      </div>

      <div className="flex-1" />

      {/* Date + Status */}
      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
        <span className="uppercase text-[10px] tracking-wider">Última actualización: hoy 08:30 AM</span>
        <span className="text-xs">Martes, 24 de Octubre</span>
      </div>

      {/* Status + User */}
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-status-good" title="Scrapers actualizados" />
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
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {isActive && '◆ '}{label}
    </button>
  );
}
