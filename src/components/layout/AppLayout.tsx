import { useAppStore } from '@/store/useAppStore';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeBrand, sidebarCollapsed } = useAppStore();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${activeBrand === 'skinglow' ? 'theme-skinglow' : ''}`}>
      <AppHeader />
      <AppSidebar />
      <main
        className={`pt-[60px] transition-all duration-300 ${
          sidebarCollapsed ? 'pl-16' : 'pl-[220px]'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
