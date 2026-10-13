import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SidebarPreferencesState } from '@shared/types'

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
