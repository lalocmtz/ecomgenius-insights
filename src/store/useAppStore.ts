import { create } from 'zustand';

export type Brand = 'feel_ink' | 'skinglow';

interface AppStore {
  activeBrand: Brand;
  dateRange: { from: Date; to: Date };
  sidebarCollapsed: boolean;
  editMode: boolean;
  setActiveBrand: (brand: Brand) => void;
  setDateRange: (range: { from: Date; to: Date }) => void;
  toggleSidebar: () => void;
  setEditMode: (mode: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeBrand: 'feel_ink',
  dateRange: {
    from: new Date(2026, 2, 1),
    to: new Date(2026, 3, 4),
  },
  sidebarCollapsed: false,
  editMode: false,
  setActiveBrand: (brand) => set({ activeBrand: brand }),
  setDateRange: (dateRange) => set({ dateRange }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setEditMode: (editMode) => set({ editMode }),
}));
