import { useAppStore } from '@/store/useAppStore';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, ShoppingBag, Video, Store, Target as TargetIcon,
  Smartphone, DollarSign, BarChart3, Flag, Bot, Settings, Zap, HelpCircle,
  ChevronLeft, ChevronRight, Palette,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: TrendingUp, label: 'Ventas', path: '/ventas' },
  { icon: Video, label: 'Lives', path: '/lives', feelInkOnly: true },
  { icon: Palette, label: 'Creativos & Pauta', path: '/creativos' },
  { icon: Smartphone, label: 'Orgánico Social', path: '/organico' },
  { icon: DollarSign, label: 'Finanzas', path: '/finanzas' },
  { icon: BarChart3, label: 'KPIs Financieros', path: '/kpis' },
  { icon: Flag, label: 'OKRs', path: '/okrs' },
  { icon: Bot, label: 'Agentes IA', path: '/agentes' },
  { icon: Settings, label: 'Configuración', path: '/configuracion' },
];

export function AppSidebar() {
  const { activeBrand, sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredItems = navItems.filter(
    (item) => !item.feelInkOnly || activeBrand === 'feel_ink'
  );

  return (
    <aside
      className={`fixed left-0 top-[60px] bottom-0 z-40 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-[220px]'
      }`}
    >
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-normal transition-colors duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground rounded-lg mx-2 px-3'
                  : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent mx-2 rounded-lg px-3'
              }`}
            >
              <Icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={() => navigate('/agentes')}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg transition-colors"
        >
          <Zap size={18} />
          {!sidebarCollapsed && <span>Análisis IA</span>}
        </button>
        <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-sidebar-foreground hover:text-foreground rounded-lg">
          <HelpCircle size={18} />
          {!sidebarCollapsed && <span>Support</span>}
        </button>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
