import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarPreferencesState {
  isCollapsed: boolean
  setCollapsed: (isCollapsed: boolean) => void
  toggleCollapsed: () => void
}

export const useSidebarPreferencesStore = create<SidebarPreferencesState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      setCollapsed: (isCollapsed) => set({ isCollapsed }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: 'ketris-sidebar-preferences',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    },
  ),
)
