export interface TenantState {
  tenantId: string | null
  tenantName: string | null
  setTenant: (id: string, name?: string | null) => void
  clearTenant: () => void
}
