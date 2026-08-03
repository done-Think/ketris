import { create } from 'zustand'

interface TenantState {
  tenantId: string | null
  tenantName: string | null
  setTenant: (id: string, name?: string | null) => void
  clearTenant: () => void
}

// Estado global do tenant ativo (multi-tenant).
export const useTenantStore = create<TenantState>((set) => ({
  tenantId: null,
  tenantName: null,
  setTenant: (tenantId, tenantName = null) => set({ tenantId, tenantName }),
  clearTenant: () => set({ tenantId: null, tenantName: null }),
}))
