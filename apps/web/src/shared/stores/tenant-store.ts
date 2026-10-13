import { create } from 'zustand'

import type { TenantState } from '@shared/types'

export const useTenantStore = create<TenantState>((set) => ({
  tenantId: null,
  tenantName: null,
  setTenant: (tenantId, tenantName = null) => set({ tenantId, tenantName }),
  clearTenant: () => set({ tenantId: null, tenantName: null }),
}))
