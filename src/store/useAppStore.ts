import { create } from 'zustand';

export type Brand = 'feel_ink' | 'skinglow';

interface AppStore {
  activeBrand: Brand;
  dateRange: { from: Date; to: Date };
  sidebarCollapsed: boolean;
  setActiveBrand: (brand: Brand) => void;
  setDateRange: (range: { from: Date; to: Date }) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeBrand: 'feel_ink',
  dateRange: {
    from: new Date(2025, 2, 1), // March 1, 2025
    to: new Date(2025, 3, 2),   // April 2, 2025
  },
  sidebarCollapsed: false,
  setActiveBrand: (brand) => set({ activeBrand: brand }),
  setDateRange: (dateRange) => set({ dateRange }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
